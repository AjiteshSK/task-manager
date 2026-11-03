import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import { env } from './env.js';

export async function connectDatabase(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);
  logger.info('Connected to MongoDB');
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('Disconnected from MongoDB');
}
