import { z } from 'zod';
import { TASK_PRIORITIES, TASK_STATUSES } from '../models/task.model.js';

// A date ("2026-11-10") or date-time ("2026-11-10T09:00:00Z"), converted to a Date
const isoDateSchema = z
  .union([z.iso.date(), z.iso.datetime({ offset: true })], 'Must be an ISO 8601 date')
  .pipe(z.coerce.date());

const taskSchema = z.strictObject({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(2000),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
  // null clears the due date
  dueDate: isoDateSchema.nullable(),
});

// No defaults here: Mongoose applies them on create, and a PATCH must never reset a field
export const createTaskSchema = taskSchema.partial().required({ title: true });

export const updateTaskSchema = taskSchema
  .partial()
  .refine((changes) => Object.keys(changes).length > 0, 'Provide at least one field to update');

// A leading "-" means descending
export const TASK_SORTS = [
  'createdAt',
  '-createdAt',
  'dueDate',
  '-dueDate',
  'priority',
  '-priority',
] as const;

export const listTasksQuerySchema = z.strictObject({
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  search: z.string().trim().max(100).optional(),
  sort: z.enum(TASK_SORTS).default('-createdAt'),
  // Query string values are strings, so coerce them to numbers
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
