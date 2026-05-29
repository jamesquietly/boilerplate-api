import { UserModule } from './user.module';
import { RegisterDto } from './user.dto';
import { createTestModule, TestingInstance } from 'src/utils/test-utils';
import request from 'supertest';

describe('UserController (integration with test DB)', () => {
  let testingInstance: TestingInstance;

  beforeAll(async () => {
    testingInstance = await createTestModule({
      imports: [UserModule],
    });
  });

  afterAll(async () => {
    await testingInstance.app.close();
  });

  describe('register', () => {
    it('should register a new user and return the user object', async () => {
      const dto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
      };

      const res = await request(testingInstance.server)
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

      await request(testingInstance.server)
        .post('/users/register')
        .send(dto)
        .expect(201);

      const res = await request(testingInstance.server)
        .post('/users/register')
        .send(dto)
        .expect(400);

      expect(res.body.message).toBe('User already exists');
    });
  });
});
