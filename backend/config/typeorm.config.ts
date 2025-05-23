import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'tasksharedb',
  username: 'muracchi',
  password: 'Kingryo0811',
  entities: ['dist/**/entities/**/*.entity.js'],
  migrations: ['dist/**/migrations/**/*.js'],
  logging: true,
});
