import type { Request, Response } from 'express';
import { getUserId } from '../middleware/auth.js';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema.js';
import * as authService from '../services/auth.service.js';
import * as userService from '../services/user.service.js';

export async function register(req: Request<unknown, unknown, RegisterInput>, res: Response) {
  const result = await authService.register(req.body);
  res.status(201).json(result);
}

export async function login(req: Request<unknown, unknown, LoginInput>, res: Response) {
  const result = await authService.login(req.body);
  res.json(result);
}

export async function me(req: Request, res: Response) {
  const user = await userService.getUserById(getUserId(req));
  res.json(user);
}
