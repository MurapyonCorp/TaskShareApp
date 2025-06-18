import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersEntity } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { Jwt } from 'src/types/auth';
import { UpdateMeDto } from './dto/update-me.dto';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

// NestJSの依存性注入可能なクラスとしてマーク（サービスなどに使う）
@Injectable()
export class AuthService {
  // コンストラクタで必要な依存関係を注入する
  constructor(
    @InjectRepository(UsersEntity) // TypeORMのリポジトリをUserエンティティに対して注入
    private readonly userRepo: Repository<UsersEntity>,
    private readonly jwt: JwtService, // JWTトークン生成のためのサービス
    private readonly config: ConfigService, // 環境変数などの設定取得用
  ) {}

  // ユーザー登録（サインアップ）処理
  async signUp(dto: SignupDto) {
    // パスワードをハッシュ化（セキュリティ対策）
    const hashed = await bcrypt.hash(dto.password, 12);
    try {
      // DTOのデータを元に新しいユーザーエンティティを作成
      const user = this.userRepo.create({
        name: dto.name,
        email: dto.email,
        hashedPassword: hashed,
        introduction: dto.introduction,
      });

      // ユーザーをDBに保存
      await this.userRepo.save(user);
      return user;
    } catch (error) {
      // PostgreSQLのユニーク制約違反コード（email重複など）
      if (error.code === '23505') {
        throw new ForbiddenException(
          'このメールアドレスは既に登録されています',
        );
      }
      // 他のエラーはそのまま投げる
      throw error;
    }
  }

  // ログイン処理（トークンを返す）
  async login(dto: LoginDto): Promise<Jwt> {
    // メールアドレスからユーザーを検索
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
    });

    // 該当ユーザーが存在しない場合
    if (!user) {
      throw new ForbiddenException('メールアドレスまたはパスワードが違います');
    }

    // パスワード検証（ハッシュと比較）
    const isValid = await bcrypt.compare(dto.password, user.hashedPassword);

    // 不一致ならエラー
    if (!isValid) {
      throw new ForbiddenException('メールアドレスまたはパスワードが違います');
    }

    // JWT生成して返す
    return this.generateJwt(user.id, user.email);
  }

  // ログイン中のユーザー情報を取得
  async getMe(userPayload: any): Promise<UsersEntity> {
    const userId = userPayload.sub; // JWTのsub（ユーザーID）を取得

    // 必要なフィールドだけ選択して取得（セキュリティ＆効率）
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'name', 'email', 'hashedPassword', 'introduction'],
    });

    if (!user) {
      throw new NotFoundException('ユーザーが見つかりません');
    }
    return user;
  }

  // 自分のユーザー情報を更新
  async updateMe(userId: number, dto: UpdateMeDto): Promise<UsersEntity> {
    // 対象ユーザーをDBから取得
    const user = await this.userRepo.findOneBy({ id: userId });

    // 存在しない場合は404エラー
    if (!user) {
      throw new NotFoundException('そのユーザーは登録されていません');
    }

    // DTOの値をuserオブジェクトに上書き（マージ）
    Object.assign(user, dto);

    // 保存して更新結果を返す
    return await this.userRepo.save(user);
  }

  // アカウント削除処理
  async remove(userId: number) {
    // TypeORMのリポジトリを使って、指定した userId のユーザーをデータベースから探す
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('ユーザーが見つかりません');

    // ユーザーが見つかれば、そのエンティティを削除。
    await this.userRepo.remove(user);
    return { message: 'アカウントを削除しました' };
  }

  // JWTトークンを生成する内部関数（ログイン成功時などに呼ばれる）
  private async generateJwt(userId: number, email: string): Promise<Jwt> {
    // JWTのペイロード（subにユーザーID、emailも含める）
    const payload = { sub: userId, email };

    // 秘密鍵はConfigServiceから取得
    const secret = this.config.get('JWT_SECRET');

    // トークンを非同期で生成（有効期限は5分）
    const token = await this.jwt.signAsync(payload, {
      expiresIn: '5m',
      secret,
    });

    // トークンを含んだオブジェクトを返す
    return {
      accessToken: token,
    };
  }
}
