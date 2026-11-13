
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authentication token required',
      });
    }

    const token = authHeader.split(' ')[1];
    const payload = await verifyToken(token);

    if (
      typeof payload.sub !== 'string' ||
      typeof payload.role !== 'string' ||
      typeof payload.email !== 'string'
    ) {
      return res.status(401).json({
        message: 'Invalid authentication token',
      });
    }

    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    };

    next();
  } catch {
    return res.status(401).json({
      message: 'Invalid or expired token',
    });
  }
}
