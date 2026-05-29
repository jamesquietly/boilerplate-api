import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserService } from 'src/users/user.service';
import { RefreshToken } from 'src/entities/RefreshToken';
import { LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userService.login(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.generateTokenPair(user);
  }

  async refreshTokens(rawRefreshToken: string) {
    try {
      const payload = this.jwtService.verify(rawRefreshToken);

      if (!payload.tokenId) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const token = await this.refreshTokenRepository.findOne({
        where: { tokenId: payload.tokenId, user: { id: payload.sub } },
      });

      if (!token) {
        throw new UnauthorizedException('Refresh token not found');
      }

      const isTokenValid = await bcrypt.compare(
        rawRefreshToken,
        token.tokenHash,
      );
      if (!isTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      await this.refreshTokenRepository.remove(token);

      const user = await this.userService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokenPair(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: number) {
    await this.refreshTokenRepository.delete({ user: { id: userId } });
  }

  private async generateTokenPair(user: { id: number; email: string }) {
    const payload = { sub: user.id, email: user.email };
    const tokenId = crypto.randomUUID();

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      { ...payload, tokenId },
      {
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '365d') as any,
      },
    );

    const tokenHash = await bcrypt.hash(refreshToken, 10);

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const refreshTokenRow = this.refreshTokenRepository.create({
      tokenId,
      tokenHash,
      user: { id: user.id },
      expiresAt,
    });
    await this.refreshTokenRepository.save(refreshTokenRow);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email },
    };
  }
}
