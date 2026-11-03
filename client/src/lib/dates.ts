import type { Task } from './types';

// Due dates are calendar dates. <input type="date"> gives "2026-11-10" and the server stores
// it as midnight UTC, so dates are formatted in UTC to show the day the user picked in any
// time zone.

export function formatDueDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** "2026-11-10T00:00:00.000Z" → "2026-11-10", the format <input type="date"> uses. */
export function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : '';
}

/** Today in the user's time zone, as "YYYY-MM-DD". */
function today(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function isOverdue(task: Pick<Task, 'dueDate' | 'status'>): boolean {
  // "YYYY-MM-DD" strings sort in date order, so a string comparison is enough
  return (
    task.dueDate !== null && task.status !== 'done' && toDateInputValue(task.dueDate) < today()
  );
}
