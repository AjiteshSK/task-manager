import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const ALGORITHM = 'HS256';

export function signToken(userId: string): string {
  return jwt.sign({}, env.JWT_SECRET, {
    algorithm: ALGORITHM,
    subject: userId,
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

/**
 * Returns the user id stored in the token. Throws a JsonWebTokenError (mapped to 401) if the
 * token is malformed, has a bad signature or has expired.
 */
export function verifyToken(token: string): string {
  // Pinning the algorithm stops a token from choosing a weaker one (e.g. "none")
  const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] });

  if (typeof payload === 'string' || !payload.sub) {
    throw new jwt.JsonWebTokenError('Token has no subject');
  }
  return payload.sub;
}
