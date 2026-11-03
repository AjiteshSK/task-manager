import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Paginated, Task, TaskListParams, TaskStatus } from '../../lib/types';
import { type TaskChanges, tasksApi } from './tasks-api';

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

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksQueryKey }),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: TaskChanges }) =>
      tasksApi.update(id, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksQueryKey }),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tasksApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksQueryKey }),
  });
}

/**
 * Changes a task's status in the UI straight away (an optimistic update), then saves it.
 * If the server rejects the change, the cached lists are put back as they were.
 */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      tasksApi.update(id, { status }),

    onMutate: async ({ id, status }) => {
      // Stop in-flight fetches from overwriting the optimistic change when they finish
      await queryClient.cancelQueries({ queryKey: tasksQueryKey });

      const previousLists = queryClient.getQueriesData<Paginated<Task>>({
        queryKey: tasksQueryKey,
      });
      queryClient.setQueriesData<Paginated<Task>>({ queryKey: tasksQueryKey }, (list) =>
        list
          ? { ...list, items: list.items.map((t) => (t.id === id ? { ...t, status } : t)) }
          : list,
      );
      // Passed to onError, so it can roll back
      return { previousLists };
    },

    onError: (error, _variables, onMutateResult) => {
      for (const [queryKey, list] of onMutateResult?.previousLists ?? []) {
        queryClient.setQueryData(queryKey, list);
      }
      toast.error(`Couldn't update the status. ${error.message}`);
    },

    // Refetch either way: the task may no longer match the current status filter
    onSettled: () => queryClient.invalidateQueries({ queryKey: tasksQueryKey }),
  });
}
