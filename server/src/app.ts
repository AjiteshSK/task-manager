import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { apiRouter } from './routes/index.js';
import { logger } from './utils/logger.js';

export const app = express();

// Render puts one proxy in front of the app. Trusting exactly one hop makes req.ip the real
// client IP (the rate limiter keys on it) without letting clients spoof X-Forwarded-For.
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet());
app.use(pinoHttp({ logger }));
// The largest valid body is a task with a 2000-character description; 20kb leaves room for that
app.use(express.json({ limit: '20kb' }));

app.use('/api', apiRouter);

app.use(notFound);
app.use(errorHandler);
