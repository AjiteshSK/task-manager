import { UserModel } from '../models/user.model.js';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema.js';
import { HttpError } from '../utils/http-error.js';
import { signToken } from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

// Unknown emails are checked against this hash so that a failed login takes the same time
// whether or not the account exists. Otherwise response times would reveal registered emails.
const dummyHash = hashPassword('dummy-password-for-unknown-users');

export async function register({ name, email, password }: RegisterInput) {
  const passwordHash = await hashPassword(password);
  // A taken email violates the unique index; the error handler turns that into a 409
  const user = await UserModel.create({ name, email, passwordHash });
  return { token: signToken(user._id.toString()), user };
}

export async function login({ email, password }: LoginInput) {
  const user = await UserModel.findOne({ email }).select('+passwordHash');
  const passwordMatches = await verifyPassword(user?.passwordHash ?? (await dummyHash), password);

  // Same message for both cases, so the response doesn't reveal which emails exist
  if (!user || !passwordMatches) {
    throw new HttpError(401, 'Invalid email or password');
  }
  return { token: signToken(user._id.toString()), user };
}
