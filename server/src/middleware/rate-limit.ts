import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';

/** Slows down password guessing and mass sign-ups: 20 attempts per IP every 15 minutes. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { message: 'Too many attempts, please try again later' } },
  // Tests register and log in many times from the same IP
  skip: () => env.NODE_ENV === 'test',
});
