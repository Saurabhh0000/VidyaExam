import { useSyncExternalStore } from "react";
import { getSnapshot, subscribe } from "../../features/auth/state/sessionStore";
import { logout } from "../../features/auth/services/auth.service";

/** Raw shared session: { status, user }. Usable by protected routes too. */
export function useSession() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * What the header reads:
 *   status  "unauthenticated" | "authenticated" | "expired"
 *   user    { userId, name, email, role, avatarUrl, memberships,
 *             activeTenantId, activeTenantName, needsTenantSelection,
 *             subscription } | null
 *   logout  the real sign-out (auth.service), only while signed in
 *
 * "loading" is not produced: nothing is restored asynchronously yet (see
 * sessionStore.js on storage).
 */
export default function useHeaderUser() {
  const { status, user } = useSession();
  return { status, user, logout: status === "authenticated" ? logout : null };
}