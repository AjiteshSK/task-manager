import { useState } from 'react';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { Pagination } from './Pagination';
import { useTasks } from './queries';
import { TaskFilters } from './TaskFilters';
import { TaskFormDialog } from './TaskFormDialog';
import { TaskList, TaskListSkeleton } from './TaskList';
import { useTaskFilters } from './use-task-filters';

export function TasksPage() {
  const { params, hasFilters, setFilter, setPage, clearFilters } = useTaskFilters();
  const tasksQuery = useTasks(params);
  const [isCreating, setIsCreating] = useState(false);
  // Changing the key remounts TaskFilters, which resets its search box after "Clear filters"
  const [filtersKey, setFiltersKey] = useState(0);

  function handleClearFilters() {
    clearFilters();
    setFiltersKey((key) => key + 1);
  }

  const total = tasksQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / params.limit);

  function renderResults() {
    if (tasksQuery.isPending) {
      return <TaskListSkeleton />;
    }
    if (tasksQuery.isError) {
      return (
        <ErrorState message={tasksQuery.error.message} onRetry={() => void tasksQuery.refetch()} />
      );
    }
    if (tasksQuery.data.items.length > 0) {
      return <TaskList tasks={tasksQuery.data.items} />;
    }
    if (hasFilters) {
      return (
        <EmptyState
          title="No matching tasks"
          description="No tasks match these filters."
          action={<Button onClick={handleClearFilters}>Clear filters</Button>}
        />
      );
    }
    if (params.page > 1) {
      // e.g. the last task on the last page was deleted
      return (
        <EmptyState
          title="This page is empty"
          description="There are no tasks on this page."
          action={<Button onClick={() => setPage(1)}>Go to first page</Button>}
        />
      );
    }
    return (
      <EmptyState
        title="No tasks yet"
        description="Create your first task to get started."
        action={<Button onClick={() => setIsCreating(true)}>Create a task</Button>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <title>Tasks · Task Manager</title>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          {tasksQuery.isSuccess && (
            <p className="text-sm text-slate-700">
              {total} {total === 1 ? 'task' : 'tasks'}
            </p>
          )}
        </div>
        <Button onClick={() => setIsCreating(true)}>New task</Button>
      </div>

      <section aria-label="Filters" className="flex flex-col gap-3">
        <TaskFilters key={filtersKey} params={params} onFilterChange={setFilter} />
        {hasFilters && (
          <Button variant="secondary" className="self-start" onClick={handleClearFilters}>
            Clear filters
          </Button>
        )}
      </section>

      {/* Dimmed while a new page or filter loads in the background */}
      <section
        aria-label="Task list"
        aria-busy={tasksQuery.isFetching}
        className={tasksQuery.isPlaceholderData ? 'opacity-60 transition-opacity' : ''}
      >
        {renderResults()}
      </section>

      <Pagination page={params.page} totalPages={totalPages} onPageChange={setPage} />

      <TaskFormDialog open={isCreating} onClose={() => setIsCreating(false)} />
    </div>
  );
}
