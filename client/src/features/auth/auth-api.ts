import { apiRequest } from '../../lib/api-client';
import type { AuthResponse, User } from '../../lib/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// The cache key for the logged-in user (GET /auth/me)
export const meQueryKey = ['me'];

export const authApi = {
  login: (body: LoginRequest) => apiRequest<AuthResponse>('/auth/login', { method: 'POST', body }),
  register: (body: RegisterRequest) =>
    apiRequest<AuthResponse>('/auth/register', { method: 'POST', body }),
  me: () => apiRequest<User>('/auth/me'),
};
