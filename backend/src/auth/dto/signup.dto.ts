import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Match } from './match.decorator';

// POST auth/signupで送信するリクエストボディのバリデーション用DTO。
export class SignupDto {
  @IsString()
  @IsNotEmpty({ message: '入力必須です' })
  name: string;

  @IsEmail({}, { message: 'メールアドレスが無効です' })
  @IsNotEmpty({ message: '入力必須です' })
  email: string;

  @IsOptional()
  @IsString()
  image_id?: string;

  @IsString()
  @IsNotEmpty({ message: '入力必須です' })
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty({ message: '入力必須です' })
  @Match('password', { message: 'パスワードが一致していません' })
  confirmPassword: string;

  @IsOptional()
  @IsString()
  introduction?: string;
}
