import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';

describe('app', () => {
  it('reports health', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns a JSON 404 for unknown API routes', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { message: 'Route not found: GET /api/does-not-exist' } });
  });

  it('rejects malformed JSON with 400', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"title": ');

    expect(res.status).toBe(400);
    expect(res.body.error.message).toEqual(expect.any(String));
  });

  it('rejects bodies over the size limit with 413', async () => {
    const res = await request(app)
      .post('/api/health')
      .send({ text: 'x'.repeat(25_000) });

    expect(res.status).toBe(413);
  });

  it('sets security headers', async () => {
    const res = await request(app).get('/api/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
