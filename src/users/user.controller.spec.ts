import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from './user.module';
import { UserService } from './user.service';
import { RegisterDto } from './user.dto';
import { createTestModule, TestingInstance } from 'src/utils/test-utils';
import request from 'supertest';

describe('UserController (integration with test DB)', () => {
  let testingInstance: TestingInstance;
  let userService: UserService;

  beforeAll(async () => {
    testingInstance = await createTestModule({
      imports: [UserModule, AuthModule],
    });

    userService = testingInstance.module.get<UserService>(UserService);
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

  describe('me', () => {
    it('should return the current user profile when authenticated', async () => {
      const email = 'me-test@example.com';
      await userService.register({ email, password: 'password123' });

      const loginRes = await request(testingInstance.server)
        .post('/auth/login')
        .send({ email, password: 'password123' })
        .expect(200);

      const cookies = loginRes.headers['set-cookie'];

      const res = await request(testingInstance.server)
        .get('/users/me')
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body).toBeDefined();
      expect(res.body.id).toBeDefined();
      expect(res.body.email).toBe(email);
    });

    it('should throw 401 when not authenticated', async () => {
      await request(testingInstance.server).get('/users/me').expect(401);
    });
  });
});
