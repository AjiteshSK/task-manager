import { useSearchParams } from 'react-router';
import { TASK_PRIORITIES, TASK_SORTS, TASK_STATUSES, type TaskListParams } from '../../lib/types';

export const PAGE_SIZE = 10;

export type TaskFilterName = 'status' | 'priority' | 'search' | 'sort';

/** Returns the URL value only if it's one of the allowed options, so an edited URL can't break the request. */
function pickOption<T extends string>(value: string | null, options: readonly T[]): T | undefined {
  return options.find((option) => option === value);
}

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

/**
 * The task list's filters, sort and page, kept in the URL query string. Reloading the page,
 * sharing the link and the back button all keep the same view.
 */
export function useTaskFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params: TaskListParams = {
    status: pickOption(searchParams.get('status'), TASK_STATUSES),
    priority: pickOption(searchParams.get('priority'), TASK_PRIORITIES),
    search: searchParams.get('search') ?? undefined,
    sort: pickOption(searchParams.get('sort'), TASK_SORTS) ?? '-createdAt',
    page: parsePage(searchParams.get('page')),
    limit: PAGE_SIZE,
  };

  const hasFilters = Boolean(params.status || params.priority || params.search);

  function setFilter(name: TaskFilterName, value: string) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) {
          next.set(name, value);
        } else {
          next.delete(name);
        }
        // A different filter or sort starts again from the first page
        next.delete('page');
        return next;
      },
      // Typing a search shouldn't add a history entry for every pause
      { replace: name === 'search' },
    );
  }

  function setPage(page: number) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('page', String(page));
      return next;
    });
  }

  function clearFilters() {
    setSearchParams({});
  }

  return { params, hasFilters, setFilter, setPage, clearFilters };
}
