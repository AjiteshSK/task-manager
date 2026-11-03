import request, { type Response } from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { bearer, createUser } from './helpers.js';

let auth: ReturnType<typeof bearer>;

beforeEach(async () => {
  const user = await createUser();
  auth = bearer(user.token);
});

async function createTask(body: Record<string, unknown>) {
  const res = await request(app).post('/api/tasks').set(auth).send(body).expect(201);
  return res.body as { id: string };
}

function titles(res: Response): string[] {
  return (res.body as { items: { title: string }[] }).items.map((task) => task.title);
}

describe('task CRUD', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/tasks');

    expect(res.status).toBe(401);
  });

  it('creates a task with defaults', async () => {
    const res = await request(app).post('/api/tasks').set(auth).send({ title: '  Write tests  ' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: expect.any(String),
      title: 'Write tests',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      userId: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('reads, updates and deletes a task', async () => {
    const task = await createTask({ title: 'Ship it', priority: 'high', dueDate: '2026-12-01' });

    const read = await request(app).get(`/api/tasks/${task.id}`).set(auth);
    expect(read.status).toBe(200);
    expect(read.body).toMatchObject({
      title: 'Ship it',
      priority: 'high',
      dueDate: '2026-12-01T00:00:00.000Z',
    });

    const updated = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .set(auth)
      .send({ status: 'done', dueDate: null });
    expect(updated.status).toBe(200);
    // Fields not in the update keep their values
    expect(updated.body).toMatchObject({
      title: 'Ship it',
      status: 'done',
      priority: 'high',
      dueDate: null,
    });

    const deleted = await request(app).delete(`/api/tasks/${task.id}`).set(auth);
    expect(deleted.status).toBe(204);

    const afterDelete = await request(app).get(`/api/tasks/${task.id}`).set(auth);
    expect(afterDelete.status).toBe(404);
    expect(afterDelete.body).toEqual({ error: { message: 'Task not found' } });
  });

  it('returns 404 for a task that does not exist', async () => {
    const missingId = '64b7f0c2a1b2c3d4e5f6a7b8';

    const read = await request(app).get(`/api/tasks/${missingId}`).set(auth);
    const update = await request(app)
      .patch(`/api/tasks/${missingId}`)
      .set(auth)
      .send({ title: 'x' });
    const remove = await request(app).delete(`/api/tasks/${missingId}`).set(auth);

    expect([read.status, update.status, remove.status]).toEqual([404, 404, 404]);
  });

  it('rejects a malformed id with 400', async () => {
    const res = await request(app).get('/api/tasks/not-an-id').set(auth);

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([{ path: 'id', message: 'Invalid id' }]);
  });

  it.each([
    ['a missing title', {}],
    ['an empty title', { title: '   ' }],
    ['a title over 200 characters', { title: 'x'.repeat(201) }],
    ['a description over 2000 characters', { title: 'ok', description: 'x'.repeat(2001) }],
    ['an unknown status', { title: 'ok', status: 'archived' }],
    ['an unknown priority', { title: 'ok', priority: 'urgent' }],
    ['a due date that is not ISO 8601', { title: 'ok', dueDate: 'next friday' }],
    ['an owner set by the client', { title: 'ok', userId: '64b7f0c2a1b2c3d4e5f6a7b8' }],
  ])('rejects %s with 400', async (_case, body) => {
    const res = await request(app).post('/api/tasks').set(auth).send(body);

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Validation failed');
  });

  it('rejects an empty update', async () => {
    const task = await createTask({ title: 'Ship it' });

    const res = await request(app).patch(`/api/tasks/${task.id}`).set(auth).send({});

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([
      { path: '', message: 'Provide at least one field to update' },
    ]);
  });
});

describe('GET /api/tasks', () => {
  // Created in this order, so the default newest-first list is the reverse
  beforeEach(async () => {
    await createTask({ title: 'Buy milk', status: 'todo', priority: 'low', dueDate: '2026-12-03' });
    await createTask({
      title: 'Write report',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2026-12-01',
    });
    await createTask({ title: 'Call the bank', status: 'done', priority: 'medium' });
    await createTask({
      title: 'Review a.b PR',
      status: 'todo',
      priority: 'high',
      dueDate: '2026-12-02',
    });
    await createTask({ title: 'Pay a bill', status: 'done', priority: 'low' });
  });

  it('returns the newest tasks first with pagination info', async () => {
    const res = await request(app).get('/api/tasks').set(auth);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 1, limit: 20, total: 5 });
    expect(titles(res)).toEqual([
      'Pay a bill',
      'Review a.b PR',
      'Call the bank',
      'Write report',
      'Buy milk',
    ]);
    expect(res.body.items[0]).toHaveProperty('id');
  });

  it.each([
    ['status', 'status=todo', ['Review a.b PR', 'Buy milk']],
    ['priority', 'priority=high', ['Review a.b PR', 'Write report']],
    ['status and priority', 'status=todo&priority=high', ['Review a.b PR']],
    ['title, ignoring case', 'search=WRITE', ['Write report']],
    // As a regex, "a.b" would also match "Pay a bill"
    ['title, matching regex characters literally', 'search=a.b', ['Review a.b PR']],
    ['title with a character that is invalid in a regex', 'search=(', []],
  ])('filters by %s', async (_case, query, expected) => {
    const res = await request(app).get(`/api/tasks?${query}`).set(auth);

    expect(res.status).toBe(200);
    expect(titles(res)).toEqual(expected);
    expect(res.body.total).toBe(expected.length);
  });

  it.each([
    ['priority', ['Buy milk', 'Pay a bill', 'Call the bank', 'Write report', 'Review a.b PR']],
    ['-priority', ['Review a.b PR', 'Write report', 'Call the bank', 'Pay a bill', 'Buy milk']],
    // Tasks without a due date come first in ascending order
    ['dueDate', ['Call the bank', 'Pay a bill', 'Write report', 'Review a.b PR', 'Buy milk']],
    ['-dueDate', ['Buy milk', 'Review a.b PR', 'Write report', 'Pay a bill', 'Call the bank']],
    ['createdAt', ['Buy milk', 'Write report', 'Call the bank', 'Review a.b PR', 'Pay a bill']],
  ])('sorts by %s', async (sort, expected) => {
    const res = await request(app).get(`/api/tasks?sort=${sort}`).set(auth);

    expect(res.status).toBe(200);
    expect(titles(res)).toEqual(expected);
  });

  it('paginates', async () => {
    const page2 = await request(app).get('/api/tasks?limit=2&page=2').set(auth);
    const page3 = await request(app).get('/api/tasks?limit=2&page=3').set(auth);

    expect(page2.body).toMatchObject({ page: 2, limit: 2, total: 5 });
    expect(titles(page2)).toEqual(['Call the bank', 'Write report']);
    expect(titles(page3)).toEqual(['Buy milk']);
  });

  it.each([
    'limit=101',
    'limit=0',
    'page=0',
    'page=abc',
    'sort=title',
    'status=archived',
    'status=todo&status=done',
    'status[$ne]=done',
    'unknown=1',
  ])('rejects the query %s with 400', async (query) => {
    const res = await request(app).get(`/api/tasks?${query}`).set(auth);

    expect(res.status).toBe(400);
  });
});
