import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

interface RequestSchemas<Params, Body, Query> {
  params?: ZodType<Params>;
  body?: ZodType<Body>;
  query?: ZodType<Query>;
}

/**
 * Parses request input with Zod. The parsed values replace the raw ones, so handlers get
 * trimmed strings, coerced numbers and defaults. A ZodError thrown here reaches the
 * central error handler, which responds with 400.
 *
 * The returned handler is typed from the schemas, so TypeScript reports an error when a
 * route validates with a schema whose output doesn't match what its controller expects.
 */
export function validate<Params = unknown, Body = unknown, Query = unknown>(
  schemas: RequestSchemas<Params, Body, Query>,
): RequestHandler<Params, unknown, Body, Query> {
  return (req, _res, next) => {
    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }
    if (schemas.query) {
      // Express 5 defines req.query as a getter, so it can't be assigned directly
      Object.defineProperty(req, 'query', { value: schemas.query.parse(req.query) });
    }
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    next();
  };
}
