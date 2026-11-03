import { Link, NavLink, Outlet } from 'react-router';
import { Button } from '../components/Button';
import { useAuth, useCurrentUser } from '../features/auth/auth-context';

function navLinkClassName({ isActive }: { isActive: boolean }) {
  return `rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-indigo-50 text-indigo-800' : 'text-slate-700 hover:bg-slate-100'
  }`;
}

/** The header and main area shared by the logged-in pages. */
export function AppLayout() {
  const user = useCurrentUser();
  const { logout } = useAuth();

  return (
    <>
      <a
        href="#main"
        className="sr-only rounded-md bg-white px-4 py-2 text-sm font-medium focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link to="/tasks" className="text-lg font-semibold text-indigo-700">
            Task Manager
          </Link>
          {/* NavLink sets aria-current="page" on the active link */}
          <nav aria-label="Main" className="flex gap-1">
            <NavLink to="/tasks" className={navLinkClassName}>
              Tasks
            </NavLink>
            <NavLink to="/profile" className={navLinkClassName}>
              Profile
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-slate-700 sm:inline">{user.name}</span>
            <Button variant="secondary" onClick={logout}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-6 focus:outline-none">
        <Outlet />
      </main>
    </>
  );
}
