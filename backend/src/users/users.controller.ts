import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

@Controller('users')
export class UsersController {
  // UsersService をDI（依存性注入）している。これによりコントローラー内でサービスのメソッドが使えるようになる。
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(): Promise<User[]> {
    // this.usersService.findAll() を呼び出し、DB内の全ユーザー情報を取得して返す。
    // 戻り値は User[] 型のPromise（非同期でユーザー配列を返す）。
    return await this.usersService.findAll();
  }

  @Get(':id/profile')
  async getProfile(@Param('id') id: string) {
    // +id により数値に変換してから getProfile() に渡す（UserのIDは基本的に数値型なので変換が必要）。
    // サービスから取得した特定ユーザーのプロフィールを返す。
    return this.usersService.getProfile(+id);
  }
}
