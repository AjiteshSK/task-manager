import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { FormError } from '../../components/FormError';
import { SelectField } from '../../components/SelectField';
import { TextareaField } from '../../components/TextareaField';
import { TextField } from '../../components/TextField';
import { getErrorMessage } from '../../lib/api-client';
import { toDateInputValue } from '../../lib/dates';
import type { Task } from '../../lib/types';
import { useCreateTask, useUpdateTask } from './queries';
import { taskFormSchema } from './schemas';
import { PRIORITY_LABELS, toOptions } from './task-labels';
import type { TaskInput } from './tasks-api';

interface TaskFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** The task to edit. Leave it out to create a new task. */
  task?: Task;
}

export function TaskFormDialog({ open, onClose, task }: TaskFormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={task ? 'Edit task' : 'New task'}>
      <TaskForm task={task} onDone={onClose} />
    </Dialog>
  );
}

const priorityOptions = toOptions(PRIORITY_LABELS);

function TaskForm({ task, onDone }: { task?: Task; onDone: () => void }) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      priority: task?.priority ?? 'medium',
      dueDate: toDateInputValue(task?.dueDate ?? null),
    },
  });

  async function onSubmit(values: TaskInput) {
    try {
      if (task) {
        await updateTask.mutateAsync({ id: task.id, changes: values });
        toast.success('Task updated');
      } else {
        await createTask.mutateAsync(values);
        toast.success('Task created');
      }
      onDone();
    } catch (error) {
      setError('root', { message: getErrorMessage(error) });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <FormError message={errors.root?.message} />
      <TextField label="Title" error={errors.title?.message} {...register('title')} />
      <TextareaField
        label="Description"
        rows={4}
        error={errors.description?.message}
        {...register('description')}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Priority" options={priorityOptions} {...register('priority')} />
        <TextField
          label="Due date"
          type="date"
          error={errors.dueDate?.message}
          {...register('dueDate')}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {task ? 'Save changes' : 'Create task'}
        </Button>
      </div>
    </form>
  );
}
