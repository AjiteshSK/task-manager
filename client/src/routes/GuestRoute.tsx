import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../features/auth/auth-context';
import { getRedirectPath } from './redirect';

/**
 * Renders the login and register pages for logged-out users. Once a user is logged in
 * (including right after submitting the login form), it sends them to where they were going.
 */
export function GuestRoute() {
  const { user } = useAuth();
  const location = useLocation();

  if (user) {
    return <Navigate to={getRedirectPath(location.state)} replace />;
  }
  return <Outlet />;
}
