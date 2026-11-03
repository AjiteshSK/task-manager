import { z } from 'zod';
import { TASK_PRIORITIES } from '../../lib/types';

// Mirrors the server's rules in server/src/schemas/task.schema.ts
export const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters'),
  description: z.string().trim().max(2000, 'Description must be at most 2000 characters'),
  priority: z.enum(TASK_PRIORITIES),
  // An empty date input means "no due date", which the API represents as null
  dueDate: z.string().transform((value) => value || null),
});
