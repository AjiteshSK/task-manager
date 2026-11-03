import { QueryClient } from '@tanstack/react-query';
import type { ApiError } from './api-client';

// Every query and mutation goes through apiRequest, which only throws ApiErrors.
// Registering the type means `error` is an ApiError everywhere, without casts.
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError;
  }
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Retry network and server errors; a 4xx response won't change on retry
        retry: (failureCount, error) =>
          failureCount < 2 && (error.status === 0 || error.status >= 500),
      },
    },
  });
}
