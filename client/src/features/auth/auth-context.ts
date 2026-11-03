import { createContext, useContext } from 'react';
import type { User } from '../../lib/types';
import type { LoginRequest, RegisterRequest } from './auth-api';

export interface AuthContextValue {
  /** The logged-in user, or null when logged out. */
  user: User | null;
  login: (request: LoginRequest) => Promise<void>;
  register: (request: RegisterRequest) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return value;
}

/** The logged-in user, for components that only render behind ProtectedRoute. */
export function useCurrentUser(): User {
  const { user } = useAuth();
  if (!user) {
    throw new Error('useCurrentUser must be used behind <ProtectedRoute>');
  }
  return user;
}
