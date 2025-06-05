import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

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
  @IsString()accessor
  introduction?: string;
}
