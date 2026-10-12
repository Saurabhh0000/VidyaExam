
import { normalizeSession, parseExpiresIn } from "../utils/session";

const STORAGE_KEY = "vidyaexam_session";

let state = { status: "unauthenticated", user: null };
let accessToken = null;
let rawData = null;
let expiryTimer = null;
let listeners = new Set();

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

function clearStoredSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage may be unavailable.
  }
}

function saveSession(result, expiresAt) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        result,
        expiresAt,
      })
    );
  } catch {
    // The in-memory session still works if storage is unavailable.
  }
}

export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getSnapshot = () => state;

export const getAccessToken = () =>
  state.status === "authenticated" ? accessToken : null;

export function startSession(result) {
  const user = normalizeSession(result?.data);

  if (!user) return false;

  clearSecrets();

  rawData = result.data;
  accessToken =
    typeof result.token === "string" ? result.token : null;

  const ttl = parseExpiresIn(result.expiresIn);
  const expiresAt = ttl !== null ? Date.now() + ttl : null;

  if (expiresAt !== null) {
    expiryTimer = setTimeout(
      expireSession,
      Math.max(0, expiresAt - Date.now())
    );
  }

  saveSession(result, expiresAt);
  publish({ status: "authenticated", user });

  return true;
}

export function restoreSession() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);

    if (!saved) return false;

    const { result, expiresAt } = JSON.parse(saved);

    if (
      expiresAt !== null &&
      expiresAt !== undefined &&
      Date.now() >= expiresAt
    ) {
      clearStoredSession();
      return false;
    }

    return startSession(result);
  } catch {
    clearStoredSession();
    return false;
  }
}

export function expireSession() {
  clearSecrets();
  clearStoredSession();
  publish({ status: "expired", user: null });
}

export function endSession() {
  clearSecrets();
  clearStoredSession();
  publish({ status: "unauthenticated", user: null });
}

export function selectTenant(tenantId) {
  if (state.status !== "authenticated" || !rawData) return false;

  const user = normalizeSession(rawData, {
    activeTenantId: tenantId,
  });

  if (!user || user.activeTenantId !== String(tenantId)) {
    return false;
  }

  publish({ status: "authenticated", user });

  return true;
}

// Restore the session once when this module is loaded.
restoreSession();
