import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  IsOptional,
} from 'class-validator';
import { Match } from 'src/common/decorators/match.decorator';

export class SignupDto {
  @IsString()
  @IsNotEmpty({ message: '入力必須です' })
  name: string;

  @IsEmail({}, { message: 'メールアドレスが無効です' })
  @IsNotEmpty({ message: '入力必須です' })
  email: string;

  @IsNotEmpty()
  @IsString()
  imageId: string | null;

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
  introduction: string;
}
