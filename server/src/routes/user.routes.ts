import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rate-limit.js';
import { validate } from '../middleware/validate.js';
import { updateMeSchema } from '../schemas/user.schema.js';

export const userRouter = Router();

userRouter.use(requireAuth);

// Rate limited because the current password can be guessed here, as on the login route
userRouter.patch('/me', authLimiter, validate({ body: updateMeSchema }), userController.updateMe);
userRouter.delete('/me', userController.deleteMe);
