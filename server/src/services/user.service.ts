import { UserModel } from '../models/user.model.js';
import { HttpError } from '../utils/http-error.js';

export async function getUserById(userId: string) {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new HttpError(404, 'User not found');
  }
  return user;
}
