import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../features/auth/auth-context';

/** Renders the child routes for logged-in users and sends everyone else to /login. */
export function ProtectedRoute() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Remember the page, so the user comes back to it after logging in
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
