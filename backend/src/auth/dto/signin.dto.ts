import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SigninDto {
  @IsEmail({}, { message: 'メールアドレスが無効です' })
  @IsNotEmpty({ message: '入力必須です' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: '入力必須です' })
  @MinLength(6)
  password!: string;
}
