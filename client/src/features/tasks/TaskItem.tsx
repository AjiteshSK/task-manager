import { formatDueDate, isOverdue } from '../../lib/dates';
import type { Task } from '../../lib/types';
import { PRIORITY_LABELS, STATUS_LABELS } from './task-labels';

const priorityStyles = {
  high: 'bg-red-50 text-red-800 ring-red-200',
  medium: 'bg-amber-50 text-amber-900 ring-amber-200',
  low: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export function TaskItem({ task }: { task: Task }) {
  const overdue = isOverdue(task);

  return (
    <li
      className={`flex flex-col gap-3 rounded-lg border bg-white p-4 shadow-xs ${
        overdue ? 'border-red-300' : 'border-slate-200'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3
          className={`font-medium break-words ${task.status === 'done' ? 'text-slate-600 line-through' : ''}`}
        >
          {task.title}
        </h3>
        <span className="text-xs text-slate-700">{STATUS_LABELS[task.status]}</span>
      </div>

      {task.description && (
        <p className="text-sm whitespace-pre-line text-slate-700">{task.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`rounded-full px-2 py-0.5 font-medium ring-1 ${priorityStyles[task.priority]}`}
        >
          {PRIORITY_LABELS[task.priority]} priority
        </span>
        {task.dueDate && (
          <span className={overdue ? 'font-medium text-red-700' : 'text-slate-700'}>
            Due {formatDueDate(task.dueDate)}
          </span>
        )}
        {/* Text, not just the red border, so the state doesn't rely on color */}
        {overdue && (
          <span className="rounded-full bg-red-700 px-2 py-0.5 font-medium text-white">
            Overdue
          </span>
        )}
      </div>
    </li>
  );
}
