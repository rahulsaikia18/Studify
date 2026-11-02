import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. Missing token.' });
  }

  const token = authHeader.split(' ')[1];
  const payload = TokenService.verifyAccessToken(token);

  if (!payload) {
    return res.status(401).json({ success: false, message: 'Invalid or expired access token.' });
  }

  req.user = payload;
  next();
}
