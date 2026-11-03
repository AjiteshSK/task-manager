import type { ReactNode } from 'react';

interface AuthLayoutProps {
  title: string;
  children: ReactNode;
  footer: ReactNode;
}

/** The centered card shared by the login and register pages. */
export function AuthLayout({ title, children, footer }: AuthLayoutProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <title>{`${title} · Task Manager`}</title>
      <div className="w-full max-w-sm">
        <p className="mb-6 text-center text-lg font-semibold text-indigo-700">Task Manager</p>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="mb-6 text-2xl font-semibold">{title}</h1>
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-slate-700">{footer}</p>
      </div>
    </main>
  );
}
