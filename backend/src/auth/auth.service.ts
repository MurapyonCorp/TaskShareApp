import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity.js';
import { Repository } from 'typeorm';
import { SignupDto } from './dto/signup.dto.js';
import { JwtService } from '@nestjs/jwt';
import { SigninDto } from './dto/signin.dto.js';
import { isPostgresError } from '../common/errors/postgres-error.js';
import { GoogleUser } from '../common/types/google-user.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(dto: SignupDto) {
    const hashed = await bcrypt.hash(dto.password, 12);
    try {
      const user = this.userRepo.create({
        name: dto.name,
        email: dto.email,
        imageId: dto.imageId,
        hashedPassword: hashed,
        introduction: dto.introduction,
      });

      await this.userRepo.save(user);
      return user;
    } catch (error) {
      if (isPostgresError(error) && error.code === '23505') {
        throw new ForbiddenException(
          'このメールアドレスは既に登録されています',
        );
      }
      throw error;
    }
  }

  async signIn(dto: SigninDto) {
    const { email, password } = dto;

    // メールアドレスからユーザーを取得
    const user = await this.userRepo.findOne({
      where: { email },
    });

    // userが見つからない場合
    if (!user) {
      throw new UnauthorizedException('ユーザが見つかりませんでした。');
    }

    // パスワード検証
    const isValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isValid) {
      throw new UnauthorizedException(
        'メールアドレスまたはパスワードが違います。',
      );
    }

    return this.issueToken(user);
  }

  async authenticateWithGoogle(googleUser: GoogleUser) {
    const user = await this.userRepo.findOne({
      where: { googleId: googleUser.providerId },
    });

    if (user) {
      return this.issueToken(user);
    }

    const newUser = this.userRepo.create({
      email: googleUser.email,
      googleId: googleUser.providerId,
      name:
        `${googleUser.lastName ?? ''} ${googleUser.firstName ?? ''}`.trim() ||
        'No Name',
      imageUrl: googleUser.picture,
    });

    const savedUser = await this.userRepo.save(newUser);

    return this.issueToken(savedUser);
  }

  private async issueToken(user: User) {
    // JWTペイロード
    const payload = {
      sub: user.id,
      email: user.email,
    };

    // トークンを発行
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      user,
      accessToken,
    };
  }
}
