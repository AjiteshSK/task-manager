import { z } from 'zod';
import { nameSchema, passwordSchema } from '../auth/schemas';

export const nameFormSchema = z.object({ name: nameSchema });

export const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type NameFormValues = z.infer<typeof nameFormSchema>;
export type PasswordFormValues = z.infer<typeof passwordFormSchema>;
