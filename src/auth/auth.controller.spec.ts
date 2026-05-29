import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthModule } from './auth.module';
import { UserService } from 'src/users/user.service';
import { createTestModule } from 'src/utils/test-utils';
import request from 'supertest';
import { Server } from 'http';

describe('AuthController (integration with test DB)', () => {
  let userService: UserService;
  let dataSource: DataSource;
  let app: INestApplication<Server>;
  let server: Server;

  beforeAll(async () => {
    const {
      module,
      app: appInstance,
      server: serverInstance,
    } = await createTestModule({
      imports: [AuthModule],
    });

    userService = module.get<UserService>(UserService);
    dataSource = module.get<DataSource>(DataSource);
    app = appInstance;
    server = serverInstance;
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('login', () => {
    it('should set cookies and return user for valid credentials', async () => {
      const email = 'login-valid@example.com';
      await userService.register({ email, password: 'password123' });

      const res = await request(server)
        .post('/auth/login')
        .send({ email, password: 'password123' });

      const cookies = (res.headers['set-cookie'] || []) as string[];
      expect(cookies.length).toBeGreaterThan(0);
      expect(cookies[0]).toContain('accessToken');
      expect(cookies[1]).toContain('refreshToken');
      expect(res.body.user).toBeDefined();
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe(email);
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('accessToken');
      expect(res.body).not.toHaveProperty('refreshToken');
    });

    it('should throw 401 for invalid email', async () => {
      await request(server)
        .post('/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' })
        .expect(401);
    });

    it('should throw 401 for wrong password', async () => {
      const email = 'login-wrongpw@example.com';
      await userService.register({ email, password: 'password123' });

      await request(server)
        .post('/auth/login')
        .send({ email, password: 'wrongpassword' })
        .expect(401);
    });
  });

  describe('refresh', () => {
    it('should return new tokens for a valid refresh token', async () => {
      const email = 'refresh-valid@example.com';
      await userService.register({ email, password: 'password123' });

      // login to get cookies with tokens
      const loginRes = await request(server)
        .post('/auth/login')
        .send({ email, password: 'password123' })
        .expect(200);

      const cookies = loginRes.headers['set-cookie'];
      expect(cookies).toBeDefined();

      // refresh with login cookies
      const refreshRes = await request(server)
        .post('/auth/refresh')
        .set('Cookie', cookies)
        .expect(200);

      const refreshCookies = refreshRes.headers['set-cookie'];
      expect(refreshCookies.length).toBeGreaterThan(0);
      expect(refreshCookies[0]).toContain('accessToken');
      expect(refreshCookies[1]).toContain('refreshToken');

      expect(refreshRes.body).toHaveProperty('user');
      expect(refreshRes.body.user).toBeDefined();
      expect(refreshRes.body.user).toHaveProperty('id');
      expect(refreshRes.body.user.email).toBe(email);
    });

    it('should throw 401 for a missing refresh token', async () => {
      await request(server).post('/auth/refresh').expect(401);
    });

    it('should throw 401 for a re-used refresh token', async () => {
      const email = 'refresh-reuse@example.com';
      await userService.register({ email, password: 'password123' });

      // login to get cookies with tokens
      const loginRes = await request(server)
        .post('/auth/login')
        .send({ email, password: 'password123' })
        .expect(200);

      const cookies = loginRes.headers['set-cookie'];
      expect(cookies).toBeDefined();

      // First refresh - should work
      await request(server)
        .post('/auth/refresh')
        .set('Cookie', cookies)
        .expect(200);

      // Second use - should fail (token was rotated)
      await request(server)
        .post('/auth/refresh')
        .set('Cookie', cookies)
        .expect(401);
    });
  });

  describe('logout', () => {
    it('should clear cookies and invalidate refresh tokens', async () => {
      const email = 'logout-test@example.com';
      await userService.register({ email, password: 'password123' });

      // login to get cookies with tokens
      const loginRes = await request(server)
        .post('/auth/login')
        .send({ email, password: 'password123' })
        .expect(200);

      const cookies = loginRes.headers['set-cookie'];
      expect(cookies).toBeDefined();

      // logout to invalidate refresh token
      await request(server)
        .post('/auth/logout')
        .set('Cookie', cookies)
        .expect(200);

      // Refresh token should be invalidated in DB
      await request(server)
        .post('/auth/refresh')
        .set('Cookie', cookies)
        .expect(401);
    });
  });
});
