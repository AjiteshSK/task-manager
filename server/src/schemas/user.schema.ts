import { z } from 'zod';
import { nameSchema, passwordSchema } from './auth.schema.js';

export const updateMeSchema = z
  .strictObject({
    name: nameSchema.optional(),
    currentPassword: z.string().min(1).max(128).optional(),
    newPassword: passwordSchema.optional(),
  })
  .refine(
    (body) => body.name !== undefined || body.newPassword !== undefined,
    'Provide a new name or a new password',
  )
  .refine((body) => body.newPassword === undefined || body.currentPassword !== undefined, {
    message: 'Current password is required to set a new password',
    path: ['currentPassword'],
  });

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
