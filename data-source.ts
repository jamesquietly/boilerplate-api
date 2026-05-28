import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: ['error', 'warn'],
  entities: [`${process.cwd()}/src/entities/**/*.{ts,js}`],
  migrations: [`${process.cwd()}/src/migrations/**/*.{ts,js}`],
  migrationsTableName: 'typeorm_migrations',
  namingStrategy: new SnakeNamingStrategy(),
});

AppDataSource.initialize()
  .then(() => {
    console.log('Data source initialized');
  })
  .catch((error) => {
    console.error('Error initializing data source:', error);
  });

export default AppDataSource;
