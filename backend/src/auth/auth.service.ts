import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { AuthDto } from './dto/auth.dto';

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
}
