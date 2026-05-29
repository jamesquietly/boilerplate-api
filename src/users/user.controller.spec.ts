import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserController } from './user.controller';
import { UserModule } from './user.module';
import { LoginDto, RegisterDto } from './user.dto';
import { createTestModule } from 'src/utils/test-utils';

describe('UserController (integration with test DB)', () => {
  let controller: UserController;
  let dataSource: DataSource;

  beforeAll(async () => {
    const module = await createTestModule({
      imports: [UserModule],
    });

    controller = module.get<UserController>(UserController);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  describe('register', () => {
    it('should register a new user and return the user object', async () => {
      const dto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
      };

      const result = await controller.register(dto);

      expect(result).toBeDefined();
      expect(result.email).toBe(dto.email);
      expect(result).toHaveProperty('id');
    });

    it('should throw BadRequestException when email already exists', async () => {
      const dto: RegisterDto = {
        email: 'dupe@example.com',
        password: 'password123',
      };

      await controller.register(dto);

      await expect(controller.register(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    it('should log in an existing user and return the user object', async () => {
      const registerDto: RegisterDto = {
        email: 'logintest@example.com',
        password: 'password123',
      };
      await controller.register(registerDto);

      const loginDto: LoginDto = {
        email: registerDto.email,
        password: registerDto.password,
      };

      const result = await controller.login(loginDto);

      expect(result).toBeDefined();
      expect(result.email).toBe(loginDto.email);
      expect(result).toHaveProperty('id');
    });

    it('should throw BadRequestException for invalid email', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      await expect(controller.login(loginDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for wrong password', async () => {
      const registerDto: RegisterDto = {
        email: 'wrongpw@example.com',
        password: 'password123',
      };
      await controller.register(registerDto);

      const loginDto: LoginDto = {
        email: registerDto.email,
        password: 'wrongpassword',
      };

      await expect(controller.login(loginDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
