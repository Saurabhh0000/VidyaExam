import { Navigate, useLocation } from "react-router-dom";
import useAuthState from "../features/auth/utils/useAuthState";

/**
 * Route guard (client-side only; the backend stays authoritative).
 *   signed out  -> 401 behaviour: /login, remembering where the user was going
 *   wrong role  -> 403 behaviour: /unauthorized
 * /login and /unauthorized are never wrapped, so there is no redirect loop.
 */
export default function RequireRole({ role, children }) {
  const { isAuthenticated, user } = useAuthState();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (role && String(user?.role ?? "").trim().toUpperCase() !== role.trim().toUpperCase()) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }
  return children;
}
