import { type InferSchemaType, model, Schema } from 'mongoose';
import { toJSONOptions } from './to-json.js';

export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;
// Ordered lowest to highest: the list endpoint sorts by position in this array
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    status: { type: String, enum: TASK_STATUSES, required: true, default: 'todo' },
    priority: { type: String, enum: TASK_PRIORITIES, required: true, default: 'medium' },
    dueDate: { type: Date, default: null },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, toJSON: toJSONOptions() },
);

// Every task query filters by userId first, then sorts or filters by one of these fields
taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, dueDate: 1 });

export type Task = InferSchemaType<typeof taskSchema>;

export const TaskModel = model('Task', taskSchema);
