import { z } from 'zod';

const envSchema = z.object({
  MONGODB_URI: z
    .string()
    .regex(/^mongodb(\+srv)?:\/\//, 'Must be a mongodb:// or mongodb+srv:// connection string'),
  JWT_SECRET: z.string().min(32, 'Must be at least 32 characters'),
  // A number followed by a unit, e.g. "15m", "12h" or "1d". The template literal type
  // matches what jsonwebtoken's expiresIn option accepts.
  JWT_EXPIRES_IN: z
    .templateLiteral([z.int(), z.enum(['s', 'm', 'h', 'd', 'w'])], 'Must look like 15m, 12h or 1d')
    .default('1d'),
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  // The logger depends on env, so plain console output is used here
  console.error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  process.exit(1);
}

export const env = result.data;
