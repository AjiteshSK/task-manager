import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <title>Page not found · Task Manager</title>
      <p className="text-sm font-semibold text-indigo-700">404</p>
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="text-slate-700">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link
        to="/"
        className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800"
      >
        Go to your tasks
      </Link>
    </main>
  );
}
