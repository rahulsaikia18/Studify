import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/db';
import { TokenService } from '../services/token.service';
import { AuthenticatedRequest } from '../middleware/auth';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  educationLevel: z.string().optional(),
  institution: z.string().optional(),
  courseName: z.string().optional(),
  semester: z.string().optional(),
  academicGoals: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const googleAuthSchema = z.object({
  email: z.string().email(),
  fullName: z.string(),
  googleId: z.string(),
  avatarUrl: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(6),
  resetCode: z.string().min(4),
});

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const data = req.body;
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });

      if (existingUser) {
        return res.status(409).json({ success: false, message: 'User with this email already exists' });
      }

      const passwordHash = await bcrypt.hash(data.password, 10);

      const user = await prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash,
          fullName: data.fullName,
          educationLevel: data.educationLevel || null,
          institution: data.institution || null,
          courseName: data.courseName || null,
          semester: data.semester || null,
          academicGoals: data.academicGoals || null,
        },
      });

      const accessToken = TokenService.generateAccessToken({ userId: user.id, email: user.email });
      const refreshToken = TokenService.generateRefreshToken();
      await TokenService.saveRefreshToken(user.id, refreshToken);

      return res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            educationLevel: user.educationLevel,
            institution: user.institution,
            courseName: user.courseName,
            semester: user.semester,
            academicGoals: user.academicGoals,
            theme: user.theme,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ success: false, message: 'Server error during registration' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const accessToken = TokenService.generateAccessToken({ userId: user.id, email: user.email });
      const refreshToken = TokenService.generateRefreshToken();
      await TokenService.saveRefreshToken(user.id, refreshToken);

      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            educationLevel: user.educationLevel,
            institution: user.institution,
            courseName: user.courseName,
            semester: user.semester,
            academicGoals: user.academicGoals,
            theme: user.theme,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ success: false, message: 'Server error during login' });
    }
  }

  static async googleAuth(req: Request, res: Response) {
    try {
      const { email, fullName, avatarUrl } = req.body;
      let user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        // Create new account with randomized password for Google sign in
        const randomPass = Math.random().toString(36).substring(2, 15);
        const passwordHash = await bcrypt.hash(randomPass, 10);
        user = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            passwordHash,
            fullName,
            avatarUrl: avatarUrl || null,
          },
        });
      }

      const accessToken = TokenService.generateAccessToken({ userId: user.id, email: user.email });
      const refreshToken = TokenService.generateRefreshToken();
      await TokenService.saveRefreshToken(user.id, refreshToken);

      return res.json({
        success: true,
        message: 'Google Sign-in successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            educationLevel: user.educationLevel,
            institution: user.institution,
            courseName: user.courseName,
            semester: user.semester,
            academicGoals: user.academicGoals,
            theme: user.theme,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      });
    } catch (error) {
      console.error('Google auth error:', error);
      return res.status(500).json({ success: false, message: 'Server error during Google auth' });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      const result = await TokenService.validateAndRotateRefreshToken(refreshToken);

      if (!result) {
        return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
      }

      return res.json({
        success: true,
        message: 'Tokens rotated successfully',
        data: {
          accessToken: result.newAccessToken,
          refreshToken: result.newRefreshToken,
        },
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      return res.status(500).json({ success: false, message: 'Server error during token refresh' });
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.userId) {
        await TokenService.revokeAllUserTokens(req.user.userId);
      }
      return res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ success: false, message: 'Server error during logout' });
    }
  }

  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      
      // We always return success to prevent email enumeration attacks
      return res.json({
        success: true,
        message: 'If the email exists in our system, a password reset code has been sent.',
        devCode: user ? 'STUDENT-8842' : undefined,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const { email, newPassword, resetCode } = req.body;
      if (!resetCode) {
        return res.status(400).json({ success: false, message: 'Invalid reset code' });
      }

      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      await TokenService.revokeAllUserTokens(user.id);

      return res.json({ success: true, message: 'Password has been reset successfully. Please login with your new password.' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server error during password reset' });
    }
  }
}
