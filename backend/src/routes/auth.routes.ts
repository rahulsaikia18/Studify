import { Router } from 'express';
import {
  AuthController,
  registerSchema,
  loginSchema,
  googleAuthSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../controllers/auth.controller';
import { validateBody } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), AuthController.register);
router.post('/login', authLimiter, validateBody(loginSchema), AuthController.login);
router.post('/google', authLimiter, validateBody(googleAuthSchema), AuthController.googleAuth);
router.post('/refresh-token', validateBody(refreshTokenSchema), AuthController.refreshToken);
router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), AuthController.resetPassword);
router.post('/logout', authenticateJWT, AuthController.logout);

export default router;
