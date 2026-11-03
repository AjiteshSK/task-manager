import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { bearer, createUser } from './helpers.js';

describe("access to another user's tasks", () => {
  let alice: Awaited<ReturnType<typeof createUser>>;
  let bob: Awaited<ReturnType<typeof createUser>>;
  let aliceTaskId: string;

  beforeEach(async () => {
    alice = await createUser({ name: 'Alice' });
    bob = await createUser({ name: 'Bob' });

    const res = await request(app)
      .post('/api/tasks')
      .set(bearer(alice.token))
      .send({ title: "Alice's task" })
      .expect(201);
    aliceTaskId = res.body.id;
  });

  // The same 404 as for a missing task, so Bob can't tell that the task exists
  const notFound = { error: { message: 'Task not found' } };

  it('cannot read it', async () => {
    const res = await request(app).get(`/api/tasks/${aliceTaskId}`).set(bearer(bob.token));

    expect(res.status).toBe(404);
    expect(res.body).toEqual(notFound);
  });

  it('cannot update it', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${aliceTaskId}`)
      .set(bearer(bob.token))
      .send({ title: 'Changed by Bob' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual(notFound);
  });

  it('cannot delete it', async () => {
    const res = await request(app).delete(`/api/tasks/${aliceTaskId}`).set(bearer(bob.token));

    expect(res.status).toBe(404);
    expect(res.body).toEqual(notFound);
  });

  it('does not see it in their list', async () => {
    const res = await request(app).get('/api/tasks').set(bearer(bob.token));

    expect(res.body).toMatchObject({ items: [], total: 0 });
  });

  it("leaves Alice's task unchanged after Bob's attempts", async () => {
    await request(app)
      .patch(`/api/tasks/${aliceTaskId}`)
      .set(bearer(bob.token))
      .send({ title: 'Changed by Bob' });
    await request(app).delete(`/api/tasks/${aliceTaskId}`).set(bearer(bob.token));

    const res = await request(app).get(`/api/tasks/${aliceTaskId}`).set(bearer(alice.token));

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Alice's task");
  });
});
