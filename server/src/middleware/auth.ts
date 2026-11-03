import type { NextFunction, Request, Response } from 'express';
import { UserModel } from '../models/user.model.js';
import { HttpError } from '../utils/http-error.js';
import { verifyToken } from '../utils/jwt.js';

// Adds userId to Express's Request type. requireAuth sets it.
declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
  }
}

/** Allows the request only with a valid "Authorization: Bearer <token>" header. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
  if (scheme !== 'Bearer' || !token) {
    throw new HttpError(401, 'Authentication required');
  }

  const userId = verifyToken(token);

  // A token stays valid after its account is deleted, so check the user still exists
  if (!(await UserModel.exists({ _id: userId }))) {
    throw new HttpError(401, 'Authentication required');
  }

  req.userId = userId;
  next();
}

/** The logged-in user's id, for handlers that run after requireAuth. */
export function getUserId(req: Pick<Request, 'userId'>): string {
  if (!req.userId) {
    throw new HttpError(401, 'Authentication required');
  }
  return req.userId;
}
