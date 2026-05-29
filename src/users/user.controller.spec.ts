import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserController } from './user.controller';
import { UserModule } from './user.module';
import { RegisterDto } from './user.dto';
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
});
