/**
 * Shared session state: one source of truth for the header (and, if you wish,
 * protected routes). Framework-free; React reads it via useSyncExternalStore
 * (see hooks/useHeaderUser.js).
 *
 * STORAGE: the access token is kept in module memory only. It is never written
 * to localStorage/sessionStorage and never exposed in state, so it can't leak
 * through React DevTools or logs. The trade-off is that a full page reload
 * signs the user out. To survive reloads safely, the backend needs to issue an
 * HttpOnly cookie plus a "current session" endpoint; see the notes delivered
 * with this change before choosing otherwise.
 */
import { normalizeSession, parseExpiresIn } from "../utils/session";

let state = { status: "unauthenticated", user: null };
let accessToken = null;
let rawData = null;
let expiryTimer = null;
const listeners = new Set();

function publish(next) {
  state = next;
  listeners.forEach((listener) => listener());
}

function clearSecrets() {
  accessToken = null;
  rawData = null;
  if (expiryTimer !== null) {
    clearTimeout(expiryTimer);
    expiryTimer = null;
  }
}

export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Stable between changes, as useSyncExternalStore requires. */
export const getSnapshot = () => state;

/** For an API client's Authorization header. Null unless signed in. */
export const getAccessToken = () =>
  state.status === "authenticated" ? accessToken : null;

/** Called with the successful login response (see auth.service.js). */
export function startSession(result) {
  const user = normalizeSession(result?.data);
  if (!user) return false;

  clearSecrets();
  rawData = result.data;
  accessToken = typeof result.token === "string" ? result.token : null;

  const ttl = parseExpiresIn(result.expiresIn);
  if (ttl !== null) expiryTimer = setTimeout(expireSession, ttl);

  publish({ status: "authenticated", user });
  return true;
}

/** Local expiry (token lifetime elapsed). Header returns to its public state. */
export function expireSession() {
  clearSecrets();
  publish({ status: "expired", user: null });
}

/** Sign-out. */
export function endSession() {
  clearSecrets();
  publish({ status: "unauthenticated", user: null });
}

/**
 * Choose the active organization for a user with several memberships. Only a
 * tenant that is actually in the login response's memberships is accepted.
 */
export function selectTenant(tenantId) {
  if (state.status !== "authenticated" || !rawData) return false;
  const user = normalizeSession(rawData, { activeTenantId: tenantId });
  if (!user || user.activeTenantId !== String(tenantId)) return false;
  publish({ status: "authenticated", user });
  return true;
}