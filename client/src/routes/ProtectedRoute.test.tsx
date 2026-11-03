import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/render';
import { server } from '../test/server';

describe('route guards', () => {
  it('sends a logged-out user from /tasks to the login page', async () => {
    renderApp('/tasks');

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Tasks' })).not.toBeInTheDocument();
  });

  it('sends a logged-in user from /login to their tasks', async () => {
    renderApp('/login', { loggedIn: true });

    expect(await screen.findByRole('heading', { name: 'Tasks' })).toBeInTheDocument();
  });

  it('logs the user out when the API rejects their token', async () => {
    server.use(
      http.get('/api/auth/me', () =>
        HttpResponse.json({ error: { message: 'Invalid or expired token' } }, { status: 401 }),
      ),
    );
    renderApp('/tasks', { loggedIn: true });

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(
      await screen.findByText('Your session has expired. Please log in again.'),
    ).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('shows the 404 page for an unknown route', async () => {
    renderApp('/no-such-page');

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});
