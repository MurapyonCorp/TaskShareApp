import 'dotenv/config';
import { DataSource } from 'typeorm';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  database: process.env.DATABASE_NAME,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  // ビルド後の .js を読む想定で書く（このファイルは dist/config/typeorm.comfig.js になる）
  entities: [path.join(__dirname, '../**/*.entity.{js,ts}')],
  migrations: [path.join(__dirname, '../migrations/*.js')],
  logging: true,
  synchronize: false,
});
