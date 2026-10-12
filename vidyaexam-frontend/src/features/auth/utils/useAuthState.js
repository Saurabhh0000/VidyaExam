import { useSyncExternalStore } from "react";
import { subscribe, getSnapshot } from "../state/sessionStore";
import { dashboardPathFor } from "../../../app/roleRoutes";

/**
 * The only place that reads the session store for RequireRole, the 403 page and
 * the student dashboard. The header keeps using useHeaderUser.
 */
export default function useAuthState() {
  const session = useSyncExternalStore(subscribe, getSnapshot);
  const u = session.status === "authenticated" ? session.user : null;

  return {
    isAuthenticated: Boolean(u),
    user: u ? { name: u.name, role: u.role } : null,
    subscription: u?.subscription ?? null,
    dashboardPath: u ? dashboardPathFor(u.role) : null,
  };
}