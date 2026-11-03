import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';
import { bearer, createUser } from './helpers.js';

describe('POST /api/auth/register', () => {
  it('creates a user and returns a token without exposing the password hash', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ann', email: '  Ann@Example.COM ', password: 'Password123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    // toEqual fails on extra keys, so this also proves passwordHash, _id and __v are absent
    expect(res.body.user).toEqual({
      id: expect.any(String),
      name: 'Ann',
      email: 'ann@example.com',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('rejects a duplicate email with 409, ignoring case', async () => {
    await createUser({ email: 'ann@example.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ann', email: 'ANN@example.com', password: 'Password123' });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: { message: 'email already exists' } });
  });

  it('returns 400 with details for invalid input', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: '', email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Validation failed');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        { path: 'name', message: 'Name is required' },
        { path: 'email', message: 'Invalid email address' },
        { path: 'password', message: 'Password must be at least 8 characters' },
      ]),
    );
  });

  it('rejects unknown fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ann', email: 'ann@example.com', password: 'Password123', role: 'admin' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('returns a token that works for authenticated requests', async () => {
    const user = await createUser();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: user.id, email: user.email });
    expect(res.body.user.passwordHash).toBeUndefined();

    const me = await request(app).get('/api/auth/me').set(bearer(res.body.token));
    expect(me.status).toBe(200);
  });

  it('returns the same 401 for a wrong password and an unknown email', async () => {
    const user = await createUser();

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'WrongPassword1' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'Password123' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual({ error: { message: 'Invalid email or password' } });
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });

  it('rejects NoSQL operator injection with 400', async () => {
    await createUser();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { $gt: '' }, password: { $gt: '' } });

    expect(res.status).toBe(400);
    expect(res.body.token).toBeUndefined();
  });
});

describe('GET /api/auth/me', () => {
  it('returns the logged-in user', async () => {
    const user = await createUser({ name: 'Ann' });

    const res = await request(app).get('/api/auth/me').set(bearer(user.token));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: user.id, name: 'Ann', email: user.email });
  });

  it('rejects a request without a token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: { message: 'Authentication required' } });
  });

  it('rejects an Authorization header that is not a Bearer token', async () => {
    const user = await createUser();

    const res = await request(app).get('/api/auth/me').set('Authorization', `Token ${user.token}`);

    expect(res.status).toBe(401);
  });

  it.each([
    ['a malformed token', () => 'not-a-jwt'],
    [
      'a token signed with another secret',
      (id: string) => jwt.sign({}, 'x'.repeat(32), { subject: id }),
    ],
    [
      'an expired token',
      (id: string) => jwt.sign({}, env.JWT_SECRET, { subject: id, expiresIn: '-1s' }),
    ],
    [
      'an unsigned token (alg "none")',
      (id: string) => jwt.sign({}, '', { subject: id, algorithm: 'none' }),
    ],
  ])('rejects %s', async (_case, makeToken) => {
    const user = await createUser();

    const res = await request(app)
      .get('/api/auth/me')
      .set(bearer(makeToken(user.id)));

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: { message: 'Invalid or expired token' } });
  });
});
