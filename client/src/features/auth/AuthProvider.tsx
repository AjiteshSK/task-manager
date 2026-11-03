import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ErrorState } from '../../components/ErrorState';
import { Spinner } from '../../components/Spinner';
import { clearToken, getToken, setToken, setUnauthorizedHandler } from '../../lib/api-client';
import type { AuthResponse } from '../../lib/types';
import { authApi, type LoginRequest, meQueryKey, type RegisterRequest } from './auth-api';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  // The token lives in localStorage so it survives reloads; this state lets React re-render
  const [token, setTokenState] = useState(getToken);

  // With a saved token, load the user it belongs to
  const meQuery = useQuery({
    queryKey: meQueryKey,
    queryFn: authApi.me,
    enabled: token !== null,
  });

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    // Remove every cached response, so the next user can't see this user's data
    queryClient.clear();
  }, [queryClient]);

  // Any 401 on a logged-in request (e.g. an expired token) logs the user out.
  // ProtectedRoute then redirects to /login because the user is gone.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      toast.error('Your session has expired. Please log in again.');
    });
    return () => setUnauthorizedHandler(undefined);
  }, [logout]);

  function startSession({ token, user }: AuthResponse) {
    setToken(token);
    // Cache the user first, so enabling the query below doesn't trigger another /me request
    queryClient.setQueryData(meQueryKey, user);
    setTokenState(token);
  }

  async function login(request: LoginRequest) {
    startSession(await authApi.login(request));
  }

  async function register(request: RegisterRequest) {
    startSession(await authApi.register(request));
  }

  // The app can't choose between public and private pages until it knows who the user is
  if (token && meQuery.isPending) {
    return (
      <div
        role="status"
        className="flex min-h-dvh items-center justify-center gap-3 text-slate-700"
      >
        <Spinner className="size-6" />
        Loading your account…
      </div>
    );
  }

  if (token && meQuery.isError) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md items-center px-4">
        <ErrorState message={meQuery.error.message} onRetry={() => void meQuery.refetch()} />
      </div>
    );
  }

  const user = token ? (meQuery.data ?? null) : null;

  return <AuthContext value={{ user, login, register, logout }}>{children}</AuthContext>;
}
