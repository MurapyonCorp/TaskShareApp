import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { ForbiddenException, RequestMethod } from '@nestjs/common';
import 'reflect-metadata';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  // --- 準備（beforeEach の方針）---
  beforeEach(async () => {
    // 各依存サービスのモック定義
    // - AuthService をモックして DI する（signUp を jest.fn()）
    const serviceMock: Partial<jest.Mocked<AuthService>> = {
      // コントローラ内で呼ばれるメソッドだけ形だけ用意
      signUp: jest.fn(),
      // ほか必要なら追加
    };

    // テスト用のモジュールを作成する
    // - TestingModule に controller: [AuthController], providers: [{ provide: AuthService, useValue: mock }] を登録
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: serviceMock }],
    }).compile();

    // - controller と service を取り出す
    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService) as jest.Mocked<AuthService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  describe("@Post('signup')", () => {
    // - 共通で使う dto を用意（name, email, password, confirmPassword, imageId, introduction）
    const dto: SignupDto = {
      name: 'dummy',
      email: 'test@dummy.com',
      password: 'dummy123',
      confirmPassword: 'dummy123',
      imageId: '5d78f017-ef80-fbbf-3aad-f3f5d6c10043',
      introduction: 'Hello, Elden',
    };

    // - 共通で使う user を用意（id, email, ...）
    const user = {
      id: 1,
      name: dto.name,
      email: dto.email,
      imageId: dto.imageId,
      introduction: dto.introduction,
      hashedPassword: 'hashed',
      imageUrl: null,
      createdAt: now,
      updatedAt: now,
    };

    // --- 正常系テスト ---
    it('Controllerが正しくServiceを呼び、正しい戻り値を返すか', async () => {
      // 3) dto の改変をしないこと（必要なら）
      //    - signUp 呼び出し前後で dto が変更されていないことを確認（オブジェクトの一部を検査）
      const before = structuredClone(dto);

      // 1) service.signUp の戻り値（例: user or { id, email, ... }）をそのまま返すこと
      //    - mockResolvedValueOnce した値と toEqual / toMatchObject で一致確認
      (service.signUp as jest.Mock).mockResolvedValueOnce(user);
      const result = await controller.signUp(dto);
      expect(result).toEqual(expect.objectContaining(user));

      // 2) controller.signUp(dto) を呼ぶと、service.signUp が一度だけ呼ばれること
      //    - 引数が dto（そのままの参照 or 値）であることを toHaveBeenCalledWith で確認
      //    - 呼び出し回数 toHaveBeenCalledTimes(1)
      expect(service.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'dummy',
          email: 'test@dummy.com',
          password: 'dummy123',
          confirmPassword: 'dummy123',
          imageId: '5d78f017-ef80-fbbf-3aad-f3f5d6c10043',
          introduction: 'Hello, Elden',
        }),
      );
      expect(service.signUp).toHaveBeenCalledTimes(1);

      // 3) dto の改変をしないこと（必要なら）
      //    - signUp 呼び出し前後で dto が変更されていないことを確認（オブジェクトの一部を検査）
      expect(dto).toEqual(before);
    });

    // 異常系テスト
    it('service.signUpの例外（ForbiddenExceptionなど）と同じ例外を返すか', async () => {
      // 4) service.signUp が ForbiddenException を投げた場合
      //    - controller.signUp も同じ例外を reject すること（rejects.toThrow(ForbiddenException)）
      //    - メッセージが一致するならメッセージも確認
      (service.signUp as jest.Mock).mockRejectedValue(
        new ForbiddenException('このメールアドレスは既に登録されています'),
      );
      await expect(controller.signUp(dto)).rejects.toThrow(
        'このメールアドレスは既に登録されています',
      );
      // 6) 異常時に余計な呼び出しが発生していないこと（必要なら）
      //    - 失敗後に他のメソッドが呼ばれていないことを確認（今回は signUp だけなので回数確認で十分）
      expect(service.signUp).toHaveBeenCalledTimes(1);
    });

    it('service.signUp が汎用的な Error を投げた場合、 controller.signUp も同じエラーをそのまま投げるか', async () => {
      // 5) service.signUp が汎用的な Error を投げた場合
      //    - controller.signUp も同じエラーをそのまま投げること（変換や握りつぶしをしない）
      (service.signUp as jest.Mock).mockRejectedValue(new Error('DB error'));
      await expect(controller.signUp(dto)).rejects.toThrow('DB error');
      // 6) 異常時に余計な呼び出しが発生していないこと（必要なら）
      //    - 失敗後に他のメソッドが呼ばれていないことを確認（今回は signUp だけなので回数確認で十分）
      expect(service.signUp).toHaveBeenCalledTimes(1);
    });

    // 追加観点
    // 7) 返却 shape の柔軟性（toMatchObject で主要項目だけ確認）
    it('Service が追加フィールドを返しても Controller は素通しで返すか', async () => {
      (service.signUp as jest.Mock).mockResolvedValue({
        id: 1,
        name: dto.name,
        email: dto.email,
        imageId: dto.imageId,
        introduction: dto.introduction,
        hashedPassword: 'hashed',
        imageUrl: null,
        createdAt: now,
        updatedAt: now,
        // 以下の余計なフィールドを含めてモックする
        extra: 'extra',
      });
      const result = await controller.signUp(dto);
      expect(result).toMatchObject(user);
      expect(result).toHaveProperty('extra', 'extra');
    });

    // 8) デコレーターの存在確認（軽め）
    it("@Post('signup') が付いているか", async () => {
      // AuthController.prototype から signUp メソッドを参照
      const target = AuthController.prototype;
      const propertyKey = 'signUp';

      // Reflect.getMetadata を使って Nest が定義しているメタデータを取得
      const routePath = Reflect.getMetadata(PATH_METADATA, target[propertyKey]);
      const requestMethod = Reflect.getMetadata(
        METHOD_METADATA,
        target[propertyKey],
      );

      // パスが'signup'であることを確認
      expect(routePath).toBe('signup');
      // HTTPメソッドが POST であることを確認
      expect(requestMethod).toBe(RequestMethod.POST);
    });

    // 8) デコレーターの存在確認（軽め）
    it("@Controller('api/auth')が付いているか", async () => {
      // クラスレベルの PATH=METADATA を取得
      const controllerPath = Reflect.getMetadata(PATH_METADATA, AuthController);

      // 'api/auth'であることを確認
      expect(controllerPath).toBe('api/auth');
    });
  });
});
