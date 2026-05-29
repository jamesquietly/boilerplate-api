import { type ModuleMetadata } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

type NestModuleImport = NonNullable<ModuleMetadata['imports']>[number];

interface TestModuleOptions {
  imports?: NestModuleImport[];
}

export async function createTestModule(
  options: TestModuleOptions,
): Promise<TestingModule> {
  const { imports = [] } = options;

  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        envFilePath: '.env',
      }),
      TypeOrmModule.forRoot({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'test',
        synchronize: false,
        logging: ['error', 'warn'],
        entities: [__dirname + '/../entities/**/*.{ts,js}'],
        migrations: [__dirname + '/../migrations/**/*.{ts,js}'],
        migrationsTableName: 'typeorm_migrations',
        namingStrategy: new SnakeNamingStrategy(),
      }),
      ...imports,
    ],
  }).compile();
}
