import type { ErrorRequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { z } from 'zod';
import { HttpError } from '../utils/http-error.js';

/** Converts any thrown value into an HttpError with the right status code. */
function toHttpError(err: unknown): HttpError {
  if (err instanceof HttpError) {
    return err;
  }

  if (err instanceof z.ZodError) {
    const details = err.issues.map((issue) => ({
      path: issue.path.map(String).join('.'),
      message: issue.message,
    }));
    return new HttpError(400, 'Validation failed', details);
  }

  // A value that can't be converted to the schema type, e.g. a malformed ObjectId
  if (err instanceof mongoose.Error.CastError) {
    return new HttpError(400, `Invalid ${err.path}`);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((error) => ({
      path: error.path,
      message: error.message,
    }));
    return new HttpError(400, 'Validation failed', details);
  }

  // Unique index violation; keyValue looks like { email: 'taken@example.com' }
  if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
    const keyValue: unknown = err.keyValue;
    const field = typeof keyValue === 'object' && keyValue ? Object.keys(keyValue)[0] : undefined;
    return new HttpError(409, `${field ?? 'Value'} already exists`);
  }

  // Also covers TokenExpiredError and NotBeforeError, which extend JsonWebTokenError
  if (err instanceof jwt.JsonWebTokenError) {
    return new HttpError(401, 'Invalid or expired token');
  }

  // express.json() errors have a `type` such as "entity.parse.failed" and a 4xx status:
  // 400 for malformed JSON, 413 for a body over the size limit
  if (
    err instanceof Error &&
    'type' in err &&
    'status' in err &&
    typeof err.status === 'number' &&
    err.status < 500
  ) {
    return new HttpError(err.status, err.message);
  }

  return new HttpError(500, 'Internal server error');
}

// Express recognises error handlers by their four parameters, so _next must stay
export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, _next) => {
  const httpError = toHttpError(err);

  // Unexpected errors are logged with their stack; the client only sees a generic message
  if (httpError.status >= 500) {
    req.log.error({ err }, 'Unhandled error');
  }

  res.status(httpError.status).json({
    error: { message: httpError.message, details: httpError.details },
  });
};
