import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UsersEntity } from 'src/users/entities/user.entity';
import { UpdateMeDto } from './dto/update-me.dto';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

// NestJSの@Controllerデコレーターで、URLのベースパスを 'auth' に設定
@Controller('auth')
export class AuthController {
  // コンストラクタでAuthServiceをDI（依存性注入）する
  constructor(private readonly authService: AuthService) {}

  // ユーザー登録（サインアップ）エンドポイント
  // POST /auth/signup にマッピングされる
  @Post('signup')
  signUp(@Body() dto: SignupDto) {
    // リクエストボディをDTOとして受け取り、authServiceのsignUpメソッドに渡す
    return this.authService.signUp(dto);
  }

  // ユーザーログイン用エンドポイント
  // POST /auth/login にマッピング、レスポンスステータスは常に200（OK）
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    // DTO（email/password）を受け取ってJWTを取得
    const jwt = await this.authService.login(dto);

    // JWTをHTTP OnlyなCookieとして返却
    return res.cookie('access_token', jwt.accessToken, {
      httpOnly: true, // JavaScriptからアクセスできないようにしてXSS対策
      secure: true, // HTTPS通信時のみ送信される
      sameSite: 'none', // クロスサイトクッキー送信を許可（必要なら CORSと合わせて使う）
      path: '/', // アプリ全体で有効なCookieにする
    });
  }

  // 現在ログイン中のユーザー情報取得
  // GET /auth/me にマッピング
  @Get('me')
  getMe(@Req() req: Request) {
    // リクエストオブジェクトに含まれているユーザー情報をサービスに渡す
    return this.authService.getMe(req.user);
  }

  // 自身のプロフィール情報を更新
  // PATCH /auth/me にマッピングされ、JWT認証が必要
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(
    @GetUser() user: UsersEntity, // カスタムデコレーターでログインユーザーを取得
    @Body() dto: UpdateMeDto, // 更新内容（nameやemailなど）をDTOとして受け取る
  ) {
    // ユーザーIDとDTOを渡して更新処理を実行
    return this.authService.updateMe(user.id, dto);
  }

  // ログアウト処理
  // DELETE /auth/logout にマッピング、レスポンスステータスは常に200（OK）
  @HttpCode(HttpStatus.OK)
  @Delete('/logout')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // access_tokenを空のCookieで上書きして削除（セッション破棄）
    return res.cookie('access_token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });
  }

  // アカウント削除処理
  // JWT認証ガードを使って、ログイン中のユーザーしかこのエンドポイントにアクセスできないようにする
  @UseGuards(JwtAuthGuard)
  @Delete('me')
  // カスタムデコレーターで、ログインユーザーの情報を user として取得。中身には user.id, user.email などが入っている
  async removeMe(
    @GetUser() user: UsersEntity,
    // res: Response はレスポンスオブジェクトで、@Res({ passthrough: true }) によって NestJSに制御を戻しながらもレスポンス操作できるようにしている
    @Res({ passthrough: true }) res: Response,
  ) {
    // サービス層に user.id を渡して「このユーザーを削除して」とお願いする。非同期処理なので await を使用。
    return this.authService.remove(user.id);

    // ログアウト処理と同じ：access_tokenを消す
    // クライアント側に保存されていたJWT Cookie（access_token）を 空にして上書き＝削除
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });

    return { message: 'アカウントを削除し、ログアウトしました' };
  }
}
