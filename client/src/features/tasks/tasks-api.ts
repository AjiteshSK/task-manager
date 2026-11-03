import { apiRequest } from '../../lib/api-client';
import type { Paginated, Task, TaskListParams, TaskPriority, TaskStatus } from '../../lib/types';

/** The fields the task form edits. Status is changed separately (see StatusSelect). */
export interface TaskInput {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string | null;
}

export type TaskChanges = Partial<TaskInput> & { status?: TaskStatus };

function toQueryString(params: TaskListParams): string {
  const query = new URLSearchParams({
    sort: params.sort,
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.status) {
    query.set('status', params.status);
  }
  if (params.priority) {
    query.set('priority', params.priority);
  }
  if (params.search) {
    query.set('search', params.search);
  }
  return query.toString();
}

export const tasksApi = {
  list: (params: TaskListParams) => apiRequest<Paginated<Task>>(`/tasks?${toQueryString(params)}`),
  create: (input: TaskInput) => apiRequest<Task>('/tasks', { method: 'POST', body: input }),
  update: (id: string, changes: TaskChanges) =>
    apiRequest<Task>(`/tasks/${id}`, { method: 'PATCH', body: changes }),
  remove: (id: string) => apiRequest<void>(`/tasks/${id}`, { method: 'DELETE' }),
};
