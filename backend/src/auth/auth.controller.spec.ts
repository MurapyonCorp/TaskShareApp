import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { SignupDto } from './dto/signup.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    // AuthServiceのモック定義
    authService = {
      signUp: jest.fn(),
      login: jest.fn(),
      getMe: jest.fn(),
      updateMe: jest.fn(),
      remove: jest.fn(),
    } as any;

    // テスト用のモジュールを作成
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    })
      // 認証ガード（JwtAuthGuard）をモックに置き換えて常に通過するようにする
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          // 認証済みユーザーとしてダミーデータを request にセット
          const req = context.switchToHttp().getRequest();
          req.user = { id: 1, email: 'user@example.com' };
          return true;
        },
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  // コントローラが正常にインスタンス化されることを確認
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // POST /auth/signup のテスト
  it('should call signUp and return user', async () => {
    const dto: SignupDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'pass',
      confirmPassword: 'pass',
    };

    const user = { id: 1, ...dto, hashedPassword: 'hashed' };

    // signUp が呼び出されたときの返り値を設定
    authService.signUp.mockResolvedValue(user);

    // controller.signUp を実行し、AuthService.signUp が呼び出されることを検証
    const result = await controller.signUp(dto);
    expect(authService.signUp).toHaveBeenCalledWith(dto);
    expect(result).toEqual(user);
  });

  // POST /auth/login のテスト
  it('should login and set cookie', async () => {
    const dto: LoginDto = {
      email: 'test@example.com',
      password: 'pass',
    };

    const jwt = { accessToken: 'jwt-token' };

    // Responseオブジェクトのモック（cookieを使えるようにする）
    const res: any = {
      cookie: jest.fn().mockReturnValue(undefined),
    };

    authService.login.mockResolvedValue(jwt);

    // ログイン実行後、JWTがcookieとして設定されていることを検証
    const result = await controller.login(dto, res);
    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(res.cookie).toHaveBeenCalledWith(
      'access_token',
      jwt.accessToken,
      expect.any(Object),
    );
    expect(result).toBeUndefined(); // 明示的なreturnがないのでundefined
  });

  // GET /auth/me のテスト
  it('should return current user from getMe', async () => {
    const user = { id: 1, email: 'user@example.com' };
    authService.getMe.mockResolvedValue(user);

    // リクエストにダミーのユーザーを渡す
    const req: any = { user: { sub: 1 } };

    // getMe を呼び出して、サービスが正しく呼ばれたか検証
    const result = await controller.getMe(req);
    expect(authService.getMe).toHaveBeenCalledWith(req.user);
    expect(result).toEqual(user);
  });

  // PATCH /auth/me のテスト（プロフィール更新）
  it('should update profile of current user', async () => {
    const dto: UpdateMeDto = {
      name: 'newName',
      introduction: 'newIntro',
    };

    const user = { id: 1, email: 'user@example.com' };
    const updatedUser = { ...user, ...dto };

    authService.updateMe.mockResolvedValue(updatedUser);

    // controller.updateMe が正しく呼ばれ、返り値も正しいか検証
    const result = await controller.updateMe(user as any, dto);
    expect(authService.updateMe).toHaveBeenCalledWith(user.id, dto);
    expect(result).toEqual(updatedUser);
  });

  // DELETE /auth/logout のテスト（クッキー削除）
  it('should clear cookie on logout', async () => {
    const req: any = {};
    const res: any = {
      cookie: jest.fn(),
    };

    const result = await controller.logout(req, res);

    // Cookieが空文字列で上書きされているか確認
    expect(res.cookie).toHaveBeenCalledWith(
      'access_token',
      '',
      expect.any(Object),
    );
    expect(result).toBeUndefined();
  });

  // DELETE /auth/me のテスト（アカウント削除＋Cookie削除）
  it('should remove user and clear cookie', async () => {
    const user = { id: 1 };

    const res: any = {
      clearCookie: jest.fn(),
    };

    authService.remove.mockResolvedValue({
      message: 'アカウントを削除しました',
    });

    const result = await controller.removeMe(user as any, res);
    expect(authService.remove).toHaveBeenCalledWith(user.id);
    expect(res.clearCookie).toHaveBeenCalledWith(
      'access_token',
      expect.any(Object),
    );
    expect(result).toEqual({ message: 'アカウントを削除しました' });
  });
});
