import { Router } from 'express';
import * as taskController from '../controllers/task.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParamsSchema } from '../schemas/common.schema.js';
import {
  createTaskSchema,
  listTasksQuerySchema,
  updateTaskSchema,
} from '../schemas/task.schema.js';

export const taskRouter = Router();

taskRouter.use(requireAuth);

taskRouter.get('/', validate({ query: listTasksQuerySchema }), taskController.listTasks);
taskRouter.post('/', validate({ body: createTaskSchema }), taskController.createTask);
taskRouter.get('/:id', validate({ params: idParamsSchema }), taskController.getTask);
taskRouter.patch(
  '/:id',
  validate({ params: idParamsSchema, body: updateTaskSchema }),
  taskController.updateTask,
);
taskRouter.delete('/:id', validate({ params: idParamsSchema }), taskController.deleteTask);
