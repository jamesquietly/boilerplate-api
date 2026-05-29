import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

dotenv.config();

const TEST_DB = 'test';

async function setupTestDatabase(): Promise<void> {
  const maintenanceDs = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres',
  });

  await maintenanceDs.initialize();

  await maintenanceDs.query(
    `DROP DATABASE IF EXISTS "${TEST_DB}" WITH (FORCE)`,
  );

  await maintenanceDs.query(`CREATE DATABASE "${TEST_DB}"`);

  await maintenanceDs.destroy();

  const testDs = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: TEST_DB,
    synchronize: false,
    logging: ['error', 'warn'],
    entities: [`${process.cwd()}/src/entities/**/*.{ts,js}`],
    migrations: [`${process.cwd()}/src/migrations/**/*.{ts,js}`],
    migrationsTableName: 'typeorm_migrations',
    namingStrategy: new SnakeNamingStrategy(),
  });

  await testDs.initialize();

  await testDs.runMigrations();

  await testDs.destroy();
}

setupTestDatabase().catch((error) => {
  console.error('Test database setup failed:', error);
  process.exit(1);
});
