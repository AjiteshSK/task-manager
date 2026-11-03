import { z } from 'zod';

export const nameSchema = z.string().trim().min(1, 'Name is required').max(100);

// Normalize before checking the format, so " Ann@Example.com " is accepted and stored lowercase
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email('Invalid email address'));

// The upper limit stops very long inputs from making password hashing expensive
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters');

export const registerSchema = z.strictObject({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.strictObject({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
