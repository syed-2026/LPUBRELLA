import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';
import { LoadingState } from '@/components/ui/States';

/**
 * Gate for any authenticated route. Redirects to /login, preserving the
 * attempted location so we can return there after a successful login.
 *
 * This is a UX convenience only - the backend is the authoritative
 * enforcement point for every request (see api/client.ts's 401 handling
 * and each endpoint's own authenticate/requireRole middleware).
 */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingState label="Checking your session…" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

/**
 * Gate for role-specific routes (STAFF vs ADMIN). A logged-in user of the
 * wrong role is redirected to their own home rather than shown a blank
 * page or an error - this is a client-side UX layer only; the backend's
 * requireRole middleware on every route remains the real security boundary.
 */
export function RoleRoute({ allow }: { allow: UserRole[] }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (!allow.includes(user.role)) {
    const home = user.role === 'ADMIN' ? '/admin' : '/staff';
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
}
