import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

// ユーザー自身が /auth/me で送信するリクエストボディのバリデーション用DTO。
export class UpdateMeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsEmail({}, { message: 'メールアドレスが無効です' })
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsOptional()
  @IsString()
  introduction?: string;
}
