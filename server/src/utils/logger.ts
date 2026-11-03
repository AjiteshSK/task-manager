import { pino } from 'pino';
import { env } from '../config/env.js';

const levels = {
  development: 'debug',
  production: 'info',
  test: 'silent',
} as const;

export const logger = pino({
  level: levels[env.NODE_ENV],
  // Never write bearer tokens to the logs
  redact: ['req.headers.authorization'],
});
