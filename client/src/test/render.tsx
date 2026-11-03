import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Toaster } from 'sonner';
import { AuthProvider } from '../features/auth/AuthProvider';
import { setToken } from '../lib/api-client';
import { AppRoutes } from '../routes/AppRoutes';
import { TEST_TOKEN } from './handlers';

interface RenderAppOptions {
  loggedIn?: boolean;
}

/** Renders the whole app at `path` with the same providers as main.tsx. */
export function renderApp(path: string, { loggedIn = false }: RenderAppOptions = {}) {
  if (loggedIn) {
    setToken(TEST_TOKEN);
  }
  // A fresh cache per test, and no retries, so failures show up immediately
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
        <Toaster />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
