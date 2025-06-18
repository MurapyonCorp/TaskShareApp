import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class UsersEntity extends BaseEntity {
  @PrimaryGeneratedColumn({
    comment: 'ユーザーID',
  })
  readonly id: number;

  @Column('varchar', { comment: 'ユーザー名' })
  name: string;

  @Column('varchar', { comment: 'メールアドレス' })
  email: string;

  @Column('varchar', { comment: 'プロフィール画像' })
  image_id: string;

  @Column('text', { comment: '自己紹介' })
  introduction: string;

  @Column({ name: 'hashed_password', comment: 'パスワード' })
  hashedPassword: string;

  @CreateDateColumn({ comment: '作成日時' })
  created_at: Date;

  @UpdateDateColumn({ comment: '更新日時' })
  updated_at: Date;

  constructor(name: string) {
    // BaseEntity は TypeORM のエンティティ用の抽象クラスで、内部的に初期化処理を持ってる
    // （型定義に明示的にコンストラクタがなくても、JavaScriptのクラス継承構造上 super() 呼ばないと this が使えない）。
    super();
    this.name = name;
  }
}
