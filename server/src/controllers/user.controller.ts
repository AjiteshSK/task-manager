import type { Request, Response } from 'express';
import { getUserId } from '../middleware/auth.js';
import type { UpdateMeInput } from '../schemas/user.schema.js';
import * as userService from '../services/user.service.js';

export async function updateMe(req: Request<unknown, unknown, UpdateMeInput>, res: Response) {
  const user = await userService.updateUser(getUserId(req), req.body);
  res.json(user);
}

export async function deleteMe(req: Request, res: Response) {
  await userService.deleteUser(getUserId(req));
  res.status(204).end();
}
