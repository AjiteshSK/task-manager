/**
 * Where to go after logging in: the page that sent the user to /login (saved in the location
 * state by ProtectedRoute), or /tasks. The state is `unknown` because anything could be there.
 */
export function getRedirectPath(state: unknown): string {
  if (isRecord(state) && isRecord(state.from) && typeof state.from.pathname === 'string') {
    const search = typeof state.from.search === 'string' ? state.from.search : '';
    return state.from.pathname + search;
  }
  return '/tasks';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
