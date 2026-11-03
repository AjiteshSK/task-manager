// Shapes returned by the API. They mirror the server's models in server/src/models;
// dates arrive as ISO strings because they travel as JSON.

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// A leading "-" means descending, as in the server's listTasksQuerySchema
export const TASK_SORTS = [
  '-createdAt',
  'createdAt',
  'dueDate',
  '-dueDate',
  '-priority',
  'priority',
] as const;

export type TaskSort = (typeof TASK_SORTS)[number];

export interface TaskListParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  sort: TaskSort;
  page: number;
  limit: number;
}
