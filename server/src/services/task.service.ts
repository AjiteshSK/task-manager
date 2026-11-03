import { type QueryFilter, Types } from 'mongoose';
import { type Task, TASK_PRIORITIES, TaskModel } from '../models/task.model.js';
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from '../schemas/task.schema.js';
import { HttpError } from '../utils/http-error.js';

// Every query filters by userId as well as _id, so users can only reach their own tasks.
// Another user's task gets the same 404 as a missing one, which hides that it exists.

export async function listTasks(userId: string, query: ListTasksQuery) {
  const { status, priority, search, sort, page, limit } = query;

  // aggregate() doesn't convert strings to ObjectIds the way find() does
  const filter: QueryFilter<Task> = { userId: new Types.ObjectId(userId) };
  if (status) {
    filter.status = status;
  }
  if (priority) {
    filter.priority = priority;
  }
  if (search) {
    // Escaping makes characters like "." or "*" match literally
    filter.title = new RegExp(RegExp.escape(search), 'i');
  }

  const direction = sort.startsWith('-') ? -1 : 1;
  const field = sort.replace('-', '');
  const sortKey = field === 'priority' ? 'priorityRank' : field;

  const [results, total] = await Promise.all([
    TaskModel.aggregate<Record<string, unknown>>([
      { $match: filter },
      // priority is stored as text, which would sort alphabetically (high, low, medium).
      // Sort by its position in TASK_PRIORITIES instead: low = 0, medium = 1, high = 2.
      { $addFields: { priorityRank: { $indexOfArray: [TASK_PRIORITIES, '$priority'] } } },
      // _id breaks ties, so tasks with equal values keep a stable order across pages
      { $sort: { [sortKey]: direction, _id: direction } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      { $unset: 'priorityRank' },
    ]),
    TaskModel.countDocuments(filter),
  ]);

  // Turn the plain results back into documents so they serialize like every other task
  const items = results.map((result) => TaskModel.hydrate(result));
  return { items, page, limit, total };
}

export function createTask(userId: string, input: CreateTaskInput) {
  return TaskModel.create({ ...input, userId });
}

export async function getTask(userId: string, taskId: string) {
  const task = await TaskModel.findOne({ _id: taskId, userId });
  if (!task) {
    throw new HttpError(404, 'Task not found');
  }
  return task;
}

export async function updateTask(userId: string, taskId: string, changes: UpdateTaskInput) {
  const task = await getTask(userId, taskId);
  task.set(changes);
  // save() runs the schema validators on the changed fields
  return task.save();
}

export async function deleteTask(userId: string, taskId: string) {
  const { deletedCount } = await TaskModel.deleteOne({ _id: taskId, userId });
  if (deletedCount === 0) {
    throw new HttpError(404, 'Task not found');
  }
}
