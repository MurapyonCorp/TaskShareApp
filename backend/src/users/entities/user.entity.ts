import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn({
    comment: 'ユーザーID',
  })
  readonly id: number;

  @Column('varchar', { comment: 'ユーザー名' })
  name: string;

  @Column('varchar', { comment: 'メールアドレス' })
  email: string;

  @Column('uuid', {
    name: 'image_id',
    nullable: true,
    comment: 'プロフィール画像',
  })
  imageId: string | null;

  @Column('text', { default: '', comment: '自己紹介' })
  introduction: string;

  @Column('text', {
    name: 'hashed_password',
    nullable: true,
    comment: 'パスワード',
  })
  hashedPassword: string | null;

  @Column('text', {
    name: 'image_url',
    nullable: true,
    comment: '外部プロフィール画像URL',
  })
  imageUrl: string | null;

  @CreateDateColumn({ name: 'created_at', comment: '作成日時' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新日時' })
  updatedAt: Date;

  constructor(name: string) {
    super();
    this.name = name;
  }
}
