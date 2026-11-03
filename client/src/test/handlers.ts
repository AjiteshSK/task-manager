import type { PathParams } from 'msw';
import { http, HttpResponse } from 'msw/http';
import type { LoginRequest } from '../features/auth/auth-api';
import type { AuthResponse, Paginated, Task, TaskPriority, User } from '../lib/types';

// A fake API for tests. It answers like the real server, using an in-memory list of tasks.

export const TEST_TOKEN = 'test-token';
export const TEST_PASSWORD = 'Password123';

export const testUser: User = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
};

export const db: { tasks: Task[] } = { tasks: [] };

export function resetDb() {
  db.tasks = [];
}

interface CreateTaskBody {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string | null;
}

function isLoggedIn(request: Request) {
  return request.headers.get('Authorization') === `Bearer ${TEST_TOKEN}`;
}

function errorResponse(status: number, message: string) {
  return HttpResponse.json({ error: { message } }, { status });
}

export const handlers = [
  http.post<PathParams, LoginRequest>('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json();
    if (email !== testUser.email || password !== TEST_PASSWORD) {
      return errorResponse(401, 'Invalid email or password');
    }
    return HttpResponse.json<AuthResponse>({ token: TEST_TOKEN, user: testUser });
  }),

  http.get('/api/auth/me', ({ request }) => {
    if (!isLoggedIn(request)) {
      return errorResponse(401, 'Authentication required');
    }
    return HttpResponse.json(testUser);
  }),

  http.get('/api/tasks', ({ request }) => {
    if (!isLoggedIn(request)) {
      return errorResponse(401, 'Authentication required');
    }
    return HttpResponse.json<Paginated<Task>>({
      items: db.tasks,
      page: 1,
      limit: 10,
      total: db.tasks.length,
    });
  }),

  http.post<PathParams, CreateTaskBody>('/api/tasks', async ({ request }) => {
    if (!isLoggedIn(request)) {
      return errorResponse(401, 'Authentication required');
    }
    const body = await request.json();
    const now = new Date().toISOString();
    const task: Task = {
      id: `task-${db.tasks.length + 1}`,
      title: body.title,
      description: body.description ?? '',
      status: 'todo',
      priority: body.priority ?? 'medium',
      dueDate: body.dueDate ?? null,
      userId: testUser.id,
      createdAt: now,
      updatedAt: now,
    };
    db.tasks.unshift(task);
    return HttpResponse.json(task, { status: 201 });
  }),
];
