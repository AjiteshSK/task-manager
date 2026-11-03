import { apiRequest } from '../../lib/api-client';
import type { User } from '../../lib/types';

/** Change the name, or the password (which needs the current one), or both. */
export interface UpdateProfileRequest {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
}

export const profileApi = {
  update: (body: UpdateProfileRequest) => apiRequest<User>('/users/me', { method: 'PATCH', body }),
  deleteAccount: () => apiRequest<void>('/users/me', { method: 'DELETE' }),
};
