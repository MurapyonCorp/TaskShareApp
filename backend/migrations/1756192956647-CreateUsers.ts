import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1756192956647 implements MigrationInterface {
  name = 'CreateUsers1756192956647';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "image_id" uuid, "introduction" text NOT NULL, "hashed_password" text, "image_url" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")); COMMENT ON COLUMN "users"."id" IS 'ユーザーID'; COMMENT ON COLUMN "users"."name" IS 'ユーザー名'; COMMENT ON COLUMN "users"."email" IS 'メールアドレス'; COMMENT ON COLUMN "users"."image_id" IS 'プロフィール画像'; COMMENT ON COLUMN "users"."introduction" IS '自己紹介'; COMMENT ON COLUMN "users"."hashed_password" IS 'パスワード'; COMMENT ON COLUMN "users"."image_url" IS '外部プロフィール画像URL'; COMMENT ON COLUMN "users"."created_at" IS '作成日時'; COMMENT ON COLUMN "users"."updated_at" IS '更新日時'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
