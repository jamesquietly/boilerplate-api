import { UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthController } from './auth.controller';
import { AuthModule } from './auth.module';
import { UserService } from 'src/users/user.service';
import { createTestModule } from 'src/utils/test-utils';

describe('AuthController (integration with test DB)', () => {
  let authController: AuthController;
  let userService: UserService;
  let dataSource: DataSource;

  beforeAll(async () => {
    const module = await createTestModule({
      imports: [AuthModule],
    });

    authController = module.get<AuthController>(AuthController);
    userService = module.get<UserService>(UserService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const email = 'login-valid@example.com';
      await userService.register({ email, password: 'password123' });

      const result = await authController.login({
        email,
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toHaveProperty('id');
      expect(result.user.email).toBe(email);
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      await expect(
        authController.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const email = 'login-wrongpw@example.com';
      await userService.register({ email, password: 'password123' });

      await expect(
        authController.login({ email, password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should return new tokens for a valid refresh token', async () => {
      const email = 'refresh-valid@example.com';
      await userService.register({ email, password: 'password123' });

      const loginResult = await authController.login({
        email,
        password: 'password123',
      });

      const result = await authController.refresh({
        refreshToken: loginResult.refreshToken,
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.refreshToken).not.toBe(loginResult.refreshToken);
    });

    it('should throw UnauthorizedException for an invalid refresh token', async () => {
      await expect(
        authController.refresh({ refreshToken: 'invalid-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for a re-used refresh token', async () => {
      const email = 'refresh-reuse@example.com';
      await userService.register({ email, password: 'password123' });

      const loginResult = await authController.login({
        email,
        password: 'password123',
      });

      // First use - should work
      await authController.refresh({
        refreshToken: loginResult.refreshToken,
      });

      // Second use - should fail (token was rotated)
      await expect(
        authController.refresh({
          refreshToken: loginResult.refreshToken,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should invalidate refresh tokens', async () => {
      const email = 'logout-test@example.com';
      await userService.register({ email, password: 'password123' });

      const loginResult = await authController.login({
        email,
        password: 'password123',
      });

      const mockReq = { user: { userId: loginResult.user.id } };
      await authController.logout(mockReq);

      await expect(
        authController.refresh({
          refreshToken: loginResult.refreshToken,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
