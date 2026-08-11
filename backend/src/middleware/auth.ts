import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';

/**
 * Verifies the JWT in the Authorization header and attaches the decoded
 * payload to req.user. Every protected route should use this first.
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError('Authentication token missing. Please log in.', 401);
  }

  const token = header.split(' ')[1];

  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    throw new AppError('Invalid or expired token. Please log in again.', 401);
  }
}

/**
 * Restricts a route to specific roles. Use AFTER `authenticate`.
 * Example: router.post('/products', authenticate, authorize('ADMIN', 'WAREHOUSE'), createProduct)
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        `Access denied. This action requires one of these roles: ${allowedRoles.join(', ')}.`,
        403
      );
    }
    next();
  };
}
