import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw/http';
import { describe, expect, it, vi } from 'vitest';
import { db, makeTask } from '../../test/handlers';
import { renderApp } from '../../test/render';
import { server } from '../../test/server';

describe('TasksPage', () => {
  it('creates a task and shows it in the list', async () => {
    const user = userEvent.setup();
    renderApp('/tasks', { loggedIn: true });

    expect(await screen.findByText('No tasks yet')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'New task' }));

    const dialog = await screen.findByRole('dialog', { name: 'New task' });
    await user.type(within(dialog).getByLabelText('Title'), 'Write the README');
    await user.type(within(dialog).getByLabelText('Description'), 'Setup and API docs');
    await user.selectOptions(within(dialog).getByLabelText('Priority'), 'high');
    await user.click(within(dialog).getByRole('button', { name: 'Create task' }));

    expect(await screen.findByRole('heading', { name: 'Write the README' })).toBeInTheDocument();
    expect(screen.getByText('Setup and API docs')).toBeInTheDocument();
    expect(screen.getByText('High priority')).toBeInTheDocument();
    expect(await screen.findByText('Task created')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(db.tasks).toHaveLength(1);
  });

  it('requires a title before sending anything', async () => {
    const createRequest = vi.fn();
    server.use(
      http.post('/api/tasks', () => {
        createRequest();
        return HttpResponse.json({});
      }),
    );
    const user = userEvent.setup();
    renderApp('/tasks', { loggedIn: true });

    await user.click(await screen.findByRole('button', { name: 'New task' }));
    const dialog = await screen.findByRole('dialog', { name: 'New task' });
    await user.click(within(dialog).getByRole('button', { name: 'Create task' }));

    expect(await within(dialog).findByText('Title is required')).toBeInTheDocument();
    expect(createRequest).not.toHaveBeenCalled();
  });

  it('changes the status at once and rolls back if the server rejects it', async () => {
    db.tasks.push(makeTask({ title: 'Pay rent', status: 'todo' }));
    // Hold the response until the test has checked the optimistic state
    let respond!: () => void;
    const responseReady = new Promise<void>((resolve) => {
      respond = resolve;
    });
    server.use(
      http.patch('/api/tasks/:id', async () => {
        await responseReady;
        return HttpResponse.json({ error: { message: 'Server error' } }, { status: 500 });
      }),
    );
    const user = userEvent.setup();
    renderApp('/tasks', { loggedIn: true });

    const status = await screen.findByRole('combobox', { name: 'Status of Pay rent' });
    await user.selectOptions(status, 'done');
    expect(status).toHaveValue('done');

    respond();
    await waitFor(() => expect(status).toHaveValue('todo'));
    expect(await screen.findByText(/Couldn't update the status/)).toBeInTheDocument();
  });
});
