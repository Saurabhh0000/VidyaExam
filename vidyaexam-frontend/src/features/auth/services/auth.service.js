import { startSession, endSession } from "../state/sessionStore";

/**
 * VidyaExam authentication service.
 *
 * Confirm registration request fields with the backend developer.
 */

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://yo.in/vidyaexam/api"
).replace(/\/$/, "");

const ENDPOINTS = {
  login: "/users/login",
  register: "/users/register",
  registerOrganization: "/tenants/registerTenant",
  // Optional. Set VITE_LOGOUT_PATH only if the backend really has a logout route
  // (e.g. to clear an HttpOnly cookie). No endpoint is assumed.
  logout: import.meta.env.VITE_LOGOUT_PATH || null,
  forgotPassword:
    import.meta.env.VITE_FORGOT_PASSWORD_PATH || "/users/forgot-password",
};

const WITH_CREDENTIALS =
  import.meta.env.VITE_AUTH_WITH_CREDENTIALS === "true";

const TIMEOUT_MS = 15000;

export class AuthError extends Error {
  constructor(kind, status = null) {
    super(kind);
    this.name = "AuthError";
    this.kind = kind;
    this.status = status;
  }
}

async function request(path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      credentials: WITH_CREDENTIALS ? "include" : "same-origin",
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new AuthError("timeout");
    }

    throw new AuthError("network");
  } finally {
    clearTimeout(timer);
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    // A successful API response must be checked below.
  }

  return { response, data };
}

function classifyFailure(status) {
  if (status === 401) return "invalid_credentials";
  if (status === 409) return "conflict";
  if (status === 400 || status === 422) return "validation";
  if (status === 403) return "forbidden";
  if (status === 404 || status === 405 || status === 501) {
    return "unavailable";
  }
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server";

  return "unexpected";
}

function assertSuccessfulResponse(response, data) {
  if (!response.ok) {
    throw new AuthError(
      classifyFailure(response.status),
      response.status
    );
  }

  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    data.success === false
  ) {
    throw new AuthError("unexpected", response.status);
  }

  return data;
}

/**
 * Publishes a successful login to the shared session store, which updates the
 * header (and anything else subscribed) immediately. The token stays in memory.
 */
function persistSession(result) {
  startSession(result);
}

const text = (value) => (typeof value === "string" ? value.trim() : value);

export async function login({ email, password }) {
  const { response, data } = await request(ENDPOINTS.login, {
    email: email.trim(),
    password,
  });

  const result = assertSuccessfulResponse(response, data);

  persistSession(result);

  return result;
}

/**
 * Individual registration — POST /users/register
 *
 * Body: { full_name, email, mobile_no, password }
 * Only these four properties are ever sent. Passwords are never trimmed.
 */
export async function register({ full_name, email, mobile_no, password }) {
  const { response, data } = await request(ENDPOINTS.register, {
    full_name: text(full_name),
    email: text(email),
    mobile_no: text(mobile_no),
    password,
  });

  return assertSuccessfulResponse(response, data);
}

/**
 * Organization registration — POST /tenants/registerTenant
 *
 * Fields are picked explicitly so frontend-only values (e.g. a password
 * confirmation) can never leak into the request body.
 */
export async function registerOrganization({
  tenant_name,
  tenant_code,
  tenant_type,
  tenant_email,
  tenant_mobile,
  address,
  admin_full_name,
  admin_email,
  admin_mobile,
  admin_password,
}) {
  const { response, data } = await request(ENDPOINTS.registerOrganization, {
    tenant_name: text(tenant_name),
    tenant_code: text(tenant_code),
    tenant_type,
    tenant_email: text(tenant_email),
    tenant_mobile: text(tenant_mobile),
    address: text(address),
    admin_full_name: text(admin_full_name),
    admin_email: text(admin_email),
    admin_mobile: text(admin_mobile),
    admin_password,
  });

  return assertSuccessfulResponse(response, data);
}

/**
 * Sign out. Calls the backend only if VITE_LOGOUT_PATH is configured, then
 * always clears the local session so the UI signs out even if that call fails.
 */
export async function logout() {
  try {
    if (ENDPOINTS.logout) await request(ENDPOINTS.logout, {});
  } catch {
    // Best effort: local sign-out below must still happen.
  } finally {
    endSession();
  }
}

export async function requestPasswordReset({ email }) {
  const { response, data } = await request(
    ENDPOINTS.forgotPassword,
    { email: email.trim() }
  );

  if (!response.ok) {
    throw new AuthError(
      classifyFailure(response.status),
      response.status
    );
  }

  return data;
}