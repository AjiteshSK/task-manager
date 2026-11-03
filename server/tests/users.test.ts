import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { TaskModel } from '../src/models/task.model.js';
import { bearer, createUser } from './helpers.js';

function login(email: string, password: string) {
  return request(app).post('/api/auth/login').send({ email, password });
}

describe('PATCH /api/users/me', () => {
  it('requires authentication', async () => {
    const res = await request(app).patch('/api/users/me').send({ name: 'New' });

    expect(res.status).toBe(401);
  });

  it('updates the name', async () => {
    const user = await createUser({ name: 'Old Name' });

    const res = await request(app)
      .patch('/api/users/me')
      .set(bearer(user.token))
      .send({ name: '  New Name  ' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: user.id, name: 'New Name', email: user.email });
    expect(res.body.passwordHash).toBeUndefined();

    const me = await request(app).get('/api/auth/me').set(bearer(user.token));
    expect(me.body.name).toBe('New Name');
  });

  it('changes the password when the current password is correct', async () => {
    const user = await createUser({ password: 'OldPassword1' });

    const res = await request(app)
      .patch('/api/users/me')
      .set(bearer(user.token))
      .send({ currentPassword: 'OldPassword1', newPassword: 'NewPassword1' });

    expect(res.status).toBe(200);
    expect(res.body.passwordHash).toBeUndefined();
    expect((await login(user.email, 'OldPassword1')).status).toBe(401);
    expect((await login(user.email, 'NewPassword1')).status).toBe(200);
  });

  it('rejects a wrong current password with 400 and keeps the old password', async () => {
    const user = await createUser({ password: 'OldPassword1' });

    const res = await request(app)
      .patch('/api/users/me')
      .set(bearer(user.token))
      .send({ currentPassword: 'WrongPassword1', newPassword: 'NewPassword1' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: { message: 'Current password is incorrect' } });
    expect((await login(user.email, 'OldPassword1')).status).toBe(200);
  });

  it('requires the current password to set a new one', async () => {
    const user = await createUser();

    const res = await request(app)
      .patch('/api/users/me')
      .set(bearer(user.token))
      .send({ newPassword: 'NewPassword1' });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([
      { path: 'currentPassword', message: 'Current password is required to set a new password' },
    ]);
  });

  it.each([
    ['an empty body', {}],
    ['a new password that is too short', { currentPassword: 'Password123', newPassword: 'short' }],
    ['an empty name', { name: '' }],
    ['a field that cannot be changed', { email: 'new@example.com' }],
  ])('rejects %s with 400', async (_case, body) => {
    const user = await createUser();

    const res = await request(app).patch('/api/users/me').set(bearer(user.token)).send(body);

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/users/me', () => {
  it('deletes the user and their tasks, leaving other users alone', async () => {
    const user = await createUser();
    const other = await createUser();
    await request(app).post('/api/tasks').set(bearer(user.token)).send({ title: 'Mine' });
    await request(app).post('/api/tasks').set(bearer(other.token)).send({ title: 'Theirs' });

    const res = await request(app).delete('/api/users/me').set(bearer(user.token));

    expect(res.status).toBe(204);
    // The token is still unexpired, but its account is gone
    expect((await request(app).get('/api/auth/me').set(bearer(user.token))).status).toBe(401);
    expect((await request(app).get('/api/tasks').set(bearer(user.token))).status).toBe(401);
    expect((await login(user.email, user.password)).status).toBe(401);

    const otherTasks = await request(app).get('/api/tasks').set(bearer(other.token));
    expect(otherTasks.body.total).toBe(1);
  });

  it('removes the tasks from the database', async () => {
    const user = await createUser();
    await request(app).post('/api/tasks').set(bearer(user.token)).send({ title: 'Mine' });

    await request(app).delete('/api/users/me').set(bearer(user.token)).expect(204);

    expect(await TaskModel.countDocuments({ userId: user.id })).toBe(0);
  });

  it('requires authentication', async () => {
    const res = await request(app).delete('/api/users/me');

    expect(res.status).toBe(401);
  });
});
