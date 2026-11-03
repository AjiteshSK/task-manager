import { useMutation, useQueryClient } from '@tanstack/react-query';
import { meQueryKey } from '../auth/auth-api';
import { useAuth } from '../auth/auth-context';
import { profileApi } from './profile-api';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileApi.update,
    // The response is the updated user; caching it updates the name in the header too
    onSuccess: (user) => queryClient.setQueryData(meQueryKey, user),
  });
}

export function useDeleteAccount() {
  const { logout } = useAuth();
  return useMutation({
    mutationFn: profileApi.deleteAccount,
    // The account is gone, so end the session; ProtectedRoute then redirects to /login
    onSuccess: () => logout(),
  });
}
