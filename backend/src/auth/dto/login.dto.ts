import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

// POST auth/signupで送信するリクエストボディのバリデーション用DTO。
export class LoginDto {
  @IsEmail({}, { message: 'メールアドレスが無効です' })
  @IsNotEmpty({ message: '入力必須です' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: '入力必須です' })
  password: string;
}
