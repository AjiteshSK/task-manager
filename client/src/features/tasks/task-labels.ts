import type { TaskPriority, TaskSort, TaskStatus } from '../../lib/types';

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const SORT_LABELS: Record<TaskSort, string> = {
  '-createdAt': 'Newest first',
  createdAt: 'Oldest first',
  dueDate: 'Due date, earliest first',
  '-dueDate': 'Due date, latest first',
  '-priority': 'Priority, high to low',
  priority: 'Priority, low to high',
};

/** Turns a label map into options for SelectField. */
export function toOptions<T extends string>(labels: Record<T, string>) {
  return (Object.entries(labels) as [T, string][]).map(([value, label]) => ({ value, label }));
}
