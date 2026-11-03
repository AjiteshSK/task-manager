import { z } from 'zod';

// MongoDB ObjectIds are 24 hex characters
export const objectIdSchema = z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid id');

export const idParamsSchema = z.strictObject({ id: objectIdSchema });

export type IdParams = z.infer<typeof idParamsSchema>;
