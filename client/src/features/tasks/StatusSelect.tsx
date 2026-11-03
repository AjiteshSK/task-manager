import { inputClassName } from '../../components/styles';
import { TASK_STATUSES, type Task } from '../../lib/types';
import { useUpdateTaskStatus } from './queries';
import { STATUS_LABELS } from './task-labels';

export function StatusSelect({ task }: { task: Task }) {
  const updateStatus = useUpdateTaskStatus();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-slate-700">Status</span>
      <select
        // Every task has one of these, so screen readers hear "Status of <title>"
        aria-label={`Status of ${task.title}`}
        className={`${inputClassName} w-auto py-1`}
        value={task.status}
        onChange={(event) => {
          const status = TASK_STATUSES.find((option) => option === event.target.value);
          if (status) {
            updateStatus.mutate({ id: task.id, status });
          }
        }}
      >
        {TASK_STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </label>
  );
}
