import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

// サービスとしてNestJSのDIコンテナで管理される。
@Injectable()
export class UsersService {
  constructor(
    //  TypeORM の User エンティティ用リポジトリを注入。これを通じてDB操作を行う。
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  // DBから全ユーザーを取得。
  async findAll(): Promise<User[]> {
    // .find() はSQLで言えば SELECT * FROM users 相当。
    return await this.userRepo.find().catch((e) => {
      // 例外発生時には InternalServerErrorException をスローし、エラー内容も表示。
      throw new InternalServerErrorException(
        `[${e.message}]：ユーザーの取得に失敗しました。`,
      );
    });
  }

  // id に一致する1件のユーザーを取得。
  async getProfile(id: number): Promise<User> {
    // .findOne({ where: { id } }) は SELECT * FROM users WHERE id = ? 相当。
    const res = await this.userRepo.findOne({ where: { id } });
    // ユーザーが存在しない場合は NotFoundException をスローして404エラーを返す。
    if (!res) {
      throw new NotFoundException(`ユーザーID ${id} が見つかりません`);
    }
    return res;
  }
}
