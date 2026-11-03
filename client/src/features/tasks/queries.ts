import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { TaskListParams } from '../../lib/types';
import { tasksApi } from './tasks-api';

// Every task list is cached under ['tasks', params]; invalidating ['tasks'] refreshes them all
export const tasksQueryKey = ['tasks'];

export function useTasks(params: TaskListParams) {
  return useQuery({
    queryKey: [...tasksQueryKey, params],
    queryFn: () => tasksApi.list(params),
    // Keep showing the current page while the next one loads, instead of a skeleton
    placeholderData: keepPreviousData,
  });
}
