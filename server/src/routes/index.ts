import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { taskRouter } from './task.routes.js';
import { userRouter } from './user.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/tasks', taskRouter);
