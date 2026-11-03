import type { Request, Response } from 'express';
import { getUserId } from '../middleware/auth.js';
import type { IdParams } from '../schemas/common.schema.js';
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from '../schemas/task.schema.js';
import * as taskService from '../services/task.service.js';

export async function listTasks(
  req: Request<unknown, unknown, unknown, ListTasksQuery>,
  res: Response,
) {
  const result = await taskService.listTasks(getUserId(req), req.query);
  res.json(result);
}

export async function createTask(req: Request<unknown, unknown, CreateTaskInput>, res: Response) {
  const task = await taskService.createTask(getUserId(req), req.body);
  res.status(201).json(task);
}

export async function getTask(req: Request<IdParams>, res: Response) {
  const task = await taskService.getTask(getUserId(req), req.params.id);
  res.json(task);
}

export async function updateTask(req: Request<IdParams, unknown, UpdateTaskInput>, res: Response) {
  const task = await taskService.updateTask(getUserId(req), req.params.id, req.body);
  res.json(task);
}

export async function deleteTask(req: Request<IdParams>, res: Response) {
  await taskService.deleteTask(getUserId(req), req.params.id);
  res.status(204).end();
}
