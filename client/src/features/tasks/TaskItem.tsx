import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { getErrorMessage } from '../../lib/api-client';
import { formatDueDate, isOverdue } from '../../lib/dates';
import type { Task } from '../../lib/types';
import { useDeleteTask } from './queries';
import { StatusSelect } from './StatusSelect';
import { PRIORITY_LABELS } from './task-labels';
import { TaskFormDialog } from './TaskFormDialog';

const priorityStyles = {
  high: 'bg-red-50 text-red-800 ring-red-200',
  medium: 'bg-amber-50 text-amber-900 ring-amber-200',
  low: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export function TaskItem({ task }: { task: Task }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const deleteTask = useDeleteTask();
  const overdue = isOverdue(task);

  // mutateAsync rather than mutate(…, { onSuccess }): the refetch after deleting removes this
  // component, and callbacks passed to mutate() don't run once it has unmounted
  async function handleDelete() {
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success('Task deleted');
    } catch (error) {
      toast.error(`Couldn't delete the task. ${getErrorMessage(error)}`);
    }
  }

  return (
    <li
      className={`flex flex-col gap-3 rounded-lg border bg-white p-4 shadow-xs ${
        overdue ? 'border-red-300' : 'border-slate-200'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3
          className={`min-w-0 font-medium break-words ${task.status === 'done' ? 'text-slate-600 line-through' : ''}`}
        >
          {task.title}
        </h3>
        <StatusSelect task={task} />
      </div>

      {task.description && (
        <p className="text-sm whitespace-pre-line text-slate-700">{task.description}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
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

        <div className="flex gap-2">
          <Button
            variant="secondary"
            aria-label={`Edit ${task.title}`}
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
          <Button
            variant="secondary"
            aria-label={`Delete ${task.title}`}
            onClick={() => setIsConfirmingDelete(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      <TaskFormDialog open={isEditing} onClose={() => setIsEditing(false)} task={task} />
      <ConfirmDialog
        open={isConfirmingDelete}
        title="Delete task?"
        description={`"${task.title}" will be permanently deleted.`}
        confirmLabel="Delete task"
        isPending={deleteTask.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={() => setIsConfirmingDelete(false)}
      />
    </li>
  );
}
