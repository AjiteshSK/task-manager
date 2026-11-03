import { app } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

try {
  await connectDatabase();
} catch (err) {
  logger.fatal({ err }, 'Could not connect to MongoDB');
  process.exit(1);
}

const server = app.listen(env.PORT, (err) => {
  if (err) {
    logger.fatal({ err }, 'Could not start the server');
    process.exit(1);
  }
  logger.info(`Server listening on port ${env.PORT}`);
});

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  logger.info(`${signal} received, shutting down`);

  // If open connections stop the server from closing in time, exit anyway
  setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();

  // Stop accepting new connections and wait for in-flight requests to finish
  await new Promise((resolve) => server.close(resolve));
  await disconnectDatabase();
  process.exit(0);
}

// Render sends SIGTERM before stopping an instance; SIGINT is Ctrl+C locally
process.once('SIGTERM', (signal) => void shutdown(signal));
process.once('SIGINT', (signal) => void shutdown(signal));
