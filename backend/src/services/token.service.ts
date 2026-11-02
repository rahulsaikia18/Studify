import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ENV } from '../config/env';
import { prisma } from '../config/db';

export interface TokenPayload {
  userId: string;
  email: string;
}

export class TokenService {
  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, ENV.JWT_ACCESS_SECRET, {
      expiresIn: ENV.JWT_ACCESS_EXPIRES_IN as any,
    });
  }

  static generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static verifyAccessToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, ENV.JWT_ACCESS_SECRET) as TokenPayload;
    } catch {
      return null;
    }
  }

  static async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ENV.JWT_REFRESH_EXPIRES_DAYS);

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  static async validateAndRotateRefreshToken(oldRefreshToken: string): Promise<{ userId: string; newAccessToken: string; newRefreshToken: string } | null> {
    const oldHash = this.hashToken(oldRefreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: oldHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      return null;
    }

    // Revoke old refresh token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new pair
    const payload: TokenPayload = {
      userId: storedToken.userId,
      email: storedToken.user.email,
    };
    const newAccessToken = this.generateAccessToken(payload);
    const newRefreshToken = this.generateRefreshToken();

    await this.saveRefreshToken(storedToken.userId, newRefreshToken);

    return {
      userId: storedToken.userId,
      newAccessToken,
      newRefreshToken,
    };
  }

  static async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
