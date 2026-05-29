import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserModule } from './user.module';
import { RegisterDto } from './user.dto';
import { createTestModule } from 'src/utils/test-utils';
import { Server } from 'http';
import request from 'supertest';

describe('UserController (integration with test DB)', () => {
  let dataSource: DataSource;
  let app: INestApplication<Server>;
  let server: Server;

  beforeAll(async () => {
    const {
      module,
      app: appInstance,
      server: serverInstance,
    } = await createTestModule({
      imports: [UserModule],
    });

    dataSource = module.get<DataSource>(DataSource);
    app = appInstance;
    server = serverInstance;
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('register', () => {
    it('should register a new user and return the user object', async () => {
      const dto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
      };

      const res = await request(server)
        .post('/users/register')
        .send(dto)
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.email).toBe(dto.email);
      expect(res.body).toHaveProperty('id');
    });

    it('should throw BadRequestException when email already exists', async () => {
      const dto: RegisterDto = {
        email: 'dupe@example.com',
        password: 'password123',
      };

      await request(server).post('/users/register').send(dto).expect(201);

      const res = await request(server)
        .post('/users/register')
        .send(dto)
        .expect(400);

      expect(res.body.message).toBe('User already exists');
    });
  });
});
