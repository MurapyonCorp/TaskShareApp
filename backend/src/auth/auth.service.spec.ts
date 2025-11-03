import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity.js';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { SignupDto } from './dto/signup.dto.js';
import { faker } from '@faker-js/faker';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// --- 準備 (beforeEach の方針) ---
// - bcrypt をモック化する（hash を jest.fn() に差し替え）
// - AuthService をテスト対象として利用する
// - UserRepository をモックして DI する
// - TestingModule を作成し、AuthController と AuthService を登録
// - service (AuthService のインスタンス) を取り出す

jest.mock('bcrypt', () => ({
  hash: jest.fn(), // bcrypt.hash をモック化
}));

describe('AuthService', () => {
  let service: AuthService;
  type UserRepo = Pick<Repository<User>, 'create' | 'save'>;

  // 各依存サービスのモック定義（Repository の代替実装）
  let userRepo = {
    create: jest.fn(), // User エンティティ作成のモック
    save: jest.fn(), // User 保存処理のモック
  } as unknown as jest.Mocked<UserRepo>;

  beforeEach(async () => {
    // テスト用のモジュールを作成する
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController], // AuthController をテスト対象に含める
      providers: [
        AuthService, // テスト対象のサービス
        { provide: getRepositoryToken(User), useValue: userRepo }, // UserRepository をモックで差し替え
      ],
    }).compile();

    // AuthService のインスタンスを取得
    service = module.get<AuthService>(AuthService);
  });

  // AuthService が正しくインスタンス化されているかの確認
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const password = faker.internet.password();

  describe('signUp()', () => {
    // - 共通で使う dto を用意（name, email, password, confirmPassword, imageId, introduction）
    const dto: SignupDto = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: password,
      confirmPassword: password,
      imageId: faker.string.uuid(),
      introduction: faker.lorem.sentence(),
    };

    const createdUser = Object.assign(new User(), {
      id: 1,
      name: dto.name,
      email: dto.email,
      imageId: dto.imageId,
      introduction: dto.introduction,
      hashedPassword: 'hashed',
      imageUrl: null,
      createdAt: now,
      updatedAt: now,
    }) as User;

    // --- 正常系テスト ---
    it('正常にユーザー登録ができ、登録したユーザーを返す', async () => {
      // 1. bcrypt.hash が呼ばれていることを spy で確認する（jest.Mockedを使ってモックしているのでspyOnは利用しない）
      const jestHash = (
        bcrypt.hash as jest.Mocked<typeof bcrypt.hash>
      ).mockResolvedValue('hashed');

      // 2. userRepo.create が呼ばれていることを spy で確認する（userRepo を as any でモックしているのでspyOnは利用しない）
      (userRepo.create as jest.Mock).mockReturnValue(createdUser);

      // 3. userRepo.save が呼ばれていることを spy で確認する（userRepo を as any でモックしているのでspyOnは利用しない）
      //    - 戻り値として user オブジェクトを返すよう mock しておく
      (
        userRepo.save as jest.MockedFunction<UserRepo['save']>
      ).mockResolvedValue(createdUser);

      const result = await service.signUp(dto);

      //    - 引数が (dto.password, 12) で渡されていることを期待する
      expect(jestHash).toHaveBeenCalledWith(dto.password, 12);

      // --- 追加観点 ---
      // bcrypt.hash が正しい回数呼ばれているか確認する
      expect(jestHash).toHaveBeenCalledTimes(1);
      // bcrypt.hash の戻り値が正しく hashedPassword として保存されているか確認する
      expect(result.hashedPassword).toBe('hashed');

      //    - 渡された引数が dto の値＋ hashedPassword であることを期待する
      expect(userRepo.create).toHaveBeenCalled();
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: dto.name,
          email: dto.email,
          imageId: dto.imageId,
          introduction: dto.introduction,
          hashedPassword: 'hashed',
        }),
      );

      // --- 追加観点 ---
      // userRepo.create が正しい回数呼ばれているか確認する
      expect(userRepo.create).toHaveBeenCalledTimes(1);

      // 4. signUp メソッドの戻り値が user オブジェクトであることを確認する
      expect(userRepo.save).toHaveBeenCalledWith(createdUser);
      expect(result).toEqual(createdUser);

      // --- 追加観点 ---
      // - userRepo.save が正しい回数呼ばれているか確認する
      // - save 後の戻り値が正しく返却されるか確認する
      expect(userRepo.save).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({
        id: 1,
        email: dto.email,
        hashedPassword: 'hashed',
      });
    });

    // --- 異常系テスト（ユニーク制約違反） ---
    it('メールアドレスが重複しており、登録できないかつエラーメッセージが表示される', async () => {
      (userRepo.create as jest.Mock).mockReturnValue(createdUser);

      // 1. userRepo.save が error.code = '23505' を投げるように mock する
      (
        userRepo.save as jest.MockedFunction<UserRepo['save']>
      ).mockRejectedValue({ code: '23505' });

      // 2. signUp 呼び出し時に ForbiddenException が throw されることを確認する
      // 3. 例外メッセージが「このメールアドレスは既に登録されています」であることを確認する
      await expect(service.signUp(dto)).rejects.toThrow(
        'このメールアドレスは既に登録されています',
      );

      // --- その他の例外 ---
      // 1. userRepo.save が '23505' 以外のエラーを投げるように mock する
      // 2. signUp 呼び出し時にそのまま同じエラーが throw されることを確認する
      (
        userRepo.save as jest.MockedFunction<UserRepo['save']>
      ).mockRejectedValue(new Error('DB error'));
      await expect(service.signUp(dto)).rejects.toThrow('DB error');
    });
  });
});
