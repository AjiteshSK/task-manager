import { TaskModel } from '../models/task.model.js';
import { UserModel } from '../models/user.model.js';
import type { UpdateMeInput } from '../schemas/user.schema.js';
import { HttpError } from '../utils/http-error.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

export async function getUserById(userId: string) {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new HttpError(404, 'User not found');
  }
  return user;
}

export async function updateUser(userId: string, changes: UpdateMeInput) {
  const { name, currentPassword, newPassword } = changes;

  const user = await UserModel.findById(userId).select('+passwordHash');
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  if (newPassword !== undefined) {
    // The schema already requires currentPassword whenever newPassword is set
    const passwordMatches =
      currentPassword !== undefined && (await verifyPassword(user.passwordHash, currentPassword));
    if (!passwordMatches) {
      // 400, not 401: the session is valid, only this input is wrong. A 401 would make the
      // client log the user out.
      throw new HttpError(400, 'Current password is incorrect');
    }
    user.passwordHash = await hashPassword(newPassword);
  }

  if (name !== undefined) {
    user.name = name;
  }

  return user.save();
}

export async function deleteUser(userId: string) {
  // Delete the tasks first. If deleting the user then fails, the account still exists and the
  // request can be retried, instead of leaving tasks that belong to no one.
  await TaskModel.deleteMany({ userId });
  await UserModel.deleteOne({ _id: userId });
}
