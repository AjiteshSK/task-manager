import request from 'supertest';
import { app } from '../src/app.js';

interface UserInput {
  name: string;
  email: string;
  password: string;
}

let userCount = 0;

/** Registers a new user with a unique email and returns their token. */
export async function createUser(overrides: Partial<UserInput> = {}) {
  userCount += 1;
  const input: UserInput = {
    name: 'Test User',
    email: `user${userCount}@example.com`,
    password: 'Password123',
    ...overrides,
  };

  const res = await request(app).post('/api/auth/register').send(input).expect(201);
  return { ...input, id: res.body.user.id as string, token: res.body.token as string };
}

export function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}
