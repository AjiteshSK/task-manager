import { Skeleton } from '../../components/Skeleton';
import type { Task } from '../../lib/types';
import { TaskItem } from './TaskItem';

export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </ul>
  );
}

export function TaskListSkeleton() {
  return (
    <div role="status" className="flex flex-col gap-3">
      <span className="sr-only">Loading tasks…</span>
      {[1, 2, 3].map((row) => (
        <div
          key={row}
          className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4"
        >
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}
