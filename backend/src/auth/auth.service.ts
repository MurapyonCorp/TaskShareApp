import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity.js';
import { Repository } from 'typeorm';
import { SignupDto } from './dto/signup.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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
      if (error.code === '23505') {
        throw new ForbiddenException(
          'このメールアドレスは既に登録されています',
        );
      }
      throw error;
    }
  }
}
