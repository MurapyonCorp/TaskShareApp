import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    // 各依存サービスのモック定義
    userRepo = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
    } as any;

    jwtService = {
      signAsync: jest.fn(),
    } as any;

    configService = {
      get: jest.fn(),
    } as any;

    // テスト用のモジュール作成
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // AuthService が正しくインスタンス化されているかの確認
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ユーザー登録成功のテスト
  it('should sign up a user successfully', async () => {
    const dto = {
      name: 'test',
      email: 'test@example.com',
      password: 'password123',
      introduction: 'hello',
    };

    const createdUser = { ...dto, id: 1, hashedPassword: 'hashed' };

    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed');
    userRepo.create.mockReturnValue(createdUser);
    userRepo.save.mockResolvedValue(createdUser);

    const result = await service.signUp(dto as any);

    expect(userRepo.create).toHaveBeenCalled(); // create が呼ばれていること
    expect(userRepo.save).toHaveBeenCalledWith(createdUser); // save が期待通りに呼ばれたか
    expect(result).toEqual(createdUser); // 結果が一致しているか
  });

  // メールアドレス重複時に例外をスローするテスト
  it('should throw ForbiddenException when email already exists', async () => {
    const dto = {
      name: 'test',
      email: 'duplicate@example.com',
      password: 'password123',
      introduction: 'hi',
    };

    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed');
    userRepo.create.mockReturnValue({ ...dto, hashedPassword: 'hashed' });
    userRepo.save.mockRejectedValue({ code: '23505' }); // PostgreSQLの重複エラー

    await expect(service.signUp(dto as any)).rejects.toThrow(
      'このメールアドレスは既に登録されています',
    );
  });

  // ログイン成功時にJWTを返すテスト
  it('should login successfully and return JWT', async () => {
    const dto = { email: 'user@example.com', password: 'pass123' };
    const user = { id: 1, email: dto.email, hashedPassword: 'hashed' };

    userRepo.findOne.mockResolvedValue(user);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true); // パスワード一致
    configService.get.mockReturnValue('secret');
    jwtService.signAsync.mockResolvedValue('fake-jwt');

    const result = await service.login(dto as any);
    expect(result).toEqual({ accessToken: 'fake-jwt' });
  });

  // ログイン時にユーザーが存在しないと例外が出る
  it('should throw ForbiddenException when user not found', async () => {
    userRepo.findOne.mockResolvedValue(null);

    await expect(
      service.login({ email: 'a', password: 'b' } as any),
    ).rejects.toThrow('メールアドレスまたはパスワードが違います');
  });

  // パスワードが一致しない場合に例外が出る
  it('should throw ForbiddenException when password is invalid', async () => {
    userRepo.findOne.mockResolvedValue({ email: 'a', hashedPassword: 'wrong' });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

    await expect(
      service.login({ email: 'a', password: 'b' } as any),
    ).rejects.toThrow('メールアドレスまたはパスワードが違います');
  });

  // ログイン中ユーザーの情報取得テスト
  it('should return current user', async () => {
    const user = {
      id: 1,
      name: 'A',
      email: 'a@example.com',
      introduction: 'yo',
    };
    userRepo.findOne.mockResolvedValue(user);

    const result = await service.getMe({ sub: 1 });
    expect(userRepo.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      select: ['id', 'name', 'email', 'introduction'],
    });
    expect(result).toEqual(user);
  });

  // プロフィールの更新成功
  it('should update user profile', async () => {
    const user = {
      id: 1,
      name: 'Old',
      email: 'old@example.com',
      introduction: 'old',
    };
    const dto = { name: 'New', introduction: 'new' };
    const updated = { ...user, ...dto };

    userRepo.findOneBy.mockResolvedValue(user);
    userRepo.save.mockResolvedValue(updated);

    const result = await service.updateMe(1, dto as any);
    expect(result).toEqual(updated);
  });

  // プロフィール更新対象が存在しない場合のテスト
  it('should throw NotFoundException if user not found on update', async () => {
    userRepo.findOneBy.mockResolvedValue(null);

    await expect(service.updateMe(999, {} as any)).rejects.toThrow(
      'そのユーザーは登録されていません',
    );
  });

  // アカウント削除成功のテスト
  it('should remove user and return message', async () => {
    const user = { id: 1 };

    userRepo.findOne.mockResolvedValue(user);
    userRepo.remove.mockResolvedValue(undefined); // remove は void を返す

    const result = await service.remove(1);

    expect(userRepo.remove).toHaveBeenCalledWith(user);
    expect(result).toEqual({ message: 'アカウントを削除しました' });
  });

  // 削除対象ユーザーが存在しない場合のテスト
  it('should throw NotFoundException if user not found on delete', async () => {
    userRepo.findOne.mockResolvedValue(null);

    await expect(service.remove(1)).rejects.toThrow('ユーザーが見つかりません');
  });
});
