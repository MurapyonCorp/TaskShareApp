import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Match } from './match.decorator';

export class AuthDto {
  @IsString()
  @IsNotEmpty({ message: '入力必須です' })
  name: string;

  @IsEmail({}, { message: 'メールアドレスが無効です' })
  @IsNotEmpty({ message: '入力必須です' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: '入力必須です' })
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty({ message: '入力必須です' })
  @Match('password', { message: 'パスワードが一致していません' })
  confirmPassword: string;
}
