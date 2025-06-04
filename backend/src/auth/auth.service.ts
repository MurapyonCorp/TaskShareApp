import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { AuthDto } from './dto/auth.dto';
import { Jwt } from 'src/types/auth';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // サインアップ
  async signUp(dto: AuthDto) {
    const hashed = await bcrypt.hash(dto.password, 12);
    try {
      const user = this.userRepo.create({
        name: dto.name,
        email: dto.email,
        hashedPassword: hashed,
        introduction: dto.introduction,
      });
      await this.userRepo.save(user);
      return user;
    } catch (error) {
      if (error.code === '23505') {
        // PostgreSQLのユニーク制約違反
        throw new ForbiddenException(
          'このメールアドレスは既に登録されています',
        );
      }
      throw error;
    }
  }

  // ログイン
  async login(dto: AuthDto): Promise<Jwt> {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new ForbiddenException('メールアドレスまたはパスワードが違います');
    }

    const isValid = await bcrypt.compare(dto.password, user.hashedPassword);

    if (!isValid) {
      throw new ForbiddenException('メールアドレスまたはパスワードが違います');
    }

    return this.generateJwt(user.id, user.email);
  }

  // ログインユーザー取得
  async getMe(userPayload: any): Promise<User> {
    const userId = userPayload.sub;
    return this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'name', 'email', 'introduction'], // 必要な情報だけ返すように
    });
  }

  // ユーザー情報更新
  async updateMe(userId: number, dto: UpdateMeDto): Promise<User> {
    const user = await this.userRepo.findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundException('そのユーザーは登録されていません');
    }

    Object.assign(user, dto);

    return await this.userRepo.save(user);
  }

  private async generateJwt(userId: number, email: string): Promise<Jwt> {
    const payload = { sub: userId, email };
    const secret = this.config.get('JWT_SECRET');

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '5m',
      secret,
    });

    return {
      accessToken: token,
    };
  }
}
