import type { RequestHandler } from 'express';
import { HttpError } from '../utils/http-error.js';

export const notFound: RequestHandler = (req) => {
  // baseUrl is the router's mount path (e.g. /api); req.path is relative to it
  throw new HttpError(404, `Route not found: ${req.method} ${req.baseUrl}${req.path}`);
};
