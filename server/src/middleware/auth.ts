import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(0o401).json({ error: 'Access token required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch (error) {
    return res.status(0o403).json({ error: 'Invalid or expired token' });
  }
};
