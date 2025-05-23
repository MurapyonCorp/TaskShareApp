export default () => ({
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    username: process.env.DATABASE_USER || 'muracchi',
    password: process.env.password || 'Kingryo0811',
    name: process.env.database || 'tasksharedb',
  },
});
