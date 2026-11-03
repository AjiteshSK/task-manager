import path from 'node:path';
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

if (env.NODE_ENV === 'production') {
  // Unknown /api routes get a JSON 404 here instead of falling through to index.html
  app.use('/api', notFound);

  // Resolves to the same folder from src/ (tsx) and dist/ (compiled): both are in server/
  const clientDist = path.resolve(import.meta.dirname, '../../client/dist');
  app.use(express.static(clientDist));
  // The React app handles its own routes (e.g. /tasks), so any other GET gets index.html
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);
