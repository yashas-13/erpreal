
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';

export function authorizeRoles(...allowedRoles: string[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access forbidden: insufficient permissions',
      });
    }

    next();
  };
}
