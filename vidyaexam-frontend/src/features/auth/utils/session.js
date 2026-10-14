/**
 * Adapter: backend login `data` object -> the header's normalized user.
 *
 * Pure and framework-free. Reads only fields that appear in the confirmed login
 * response (user_id, full_name, email, default_role, memberships[],
 * individual_subscription, tenant_subscriptions[]).
 *
 * Role resolution
 *  - default_role present            -> that role; attach a tenant only when
 *                                       exactly one matching membership exists.
 *  - else exactly one membership     -> that membership's role_name and tenant.
 *  - else several memberships        -> NO role until a tenant is chosen
 *                                       (needsTenantSelection = true). The first
 *                                       membership is never picked automatically.
 *  - else                            -> role "" (no privileged navigation).
 *
 * Subscription data is carried along for display only. It is never used to
 * derive or upgrade a role.
 */

const text = (value) => (typeof value === "string" ? value.trim() : "");
const id = (value) =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

function normalizeMemberships(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((m) => m && typeof m === "object")
    .map((m) => ({
      tenantId: id(m.tenant_id),
      tenantName: text(m.tenant_name),
      tenantCode: text(m.tenant_code),
      roleId: id(m.role_id),
      roleName: text(m.role_name),
    }))
    .filter((m) => m.tenantId && m.roleName);
}

/**
 * @param {object} data  `data` from the login response.
 * @param {{ activeTenantId?: string }} [options]  A tenant the user explicitly chose.
 * @returns {object|null} normalized user, or null if `data` is unusable.
 */
export function normalizeSession(data, options = {}) {
  if (!data || typeof data !== "object") return null;

  const memberships = normalizeMemberships(data.memberships);
  const defaultRole = text(data.default_role);

  let role = "";
  let active = null;
  let needsTenantSelection = false;

  if (defaultRole) {
    role = defaultRole;
    const matchingMemberships = memberships.filter(
      (membership) => membership.roleName.toUpperCase() === defaultRole.toUpperCase(),
    );
    const chosen = options.activeTenantId
      ? matchingMemberships.find((membership) => membership.tenantId === options.activeTenantId)
      : null;
    if (chosen) {
      active = chosen;
    } else if (matchingMemberships.length === 1) {
      active = matchingMemberships[0];
    } else if (matchingMemberships.length > 1) {
      needsTenantSelection = true;
    }
  } else {
    const chosen = options.activeTenantId
      ? memberships.find((m) => m.tenantId === options.activeTenantId)
      : null;
    if (chosen) {
      active = chosen;
    } else if (memberships.length === 1) {
      active = memberships[0];
    } else if (memberships.length > 1) {
      needsTenantSelection = true;
    }
    if (active) role = active.roleName;
  }

  let subscription = null;
  if (active) {
    const tenantSubs = Array.isArray(data.tenant_subscriptions)
      ? data.tenant_subscriptions
      : [];
    const match = tenantSubs.find((t) => t && id(t.tenant_id) === active.tenantId);
    subscription = match?.subscription ?? null;
  } else if (defaultRole) {
    subscription = data.individual_subscription ?? data.subscription ?? null;
  }

  return {
    userId: id(data.user_id),
    name: text(data.full_name),
    email: text(data.email),
    role,
    avatarUrl: "", // the login response carries no avatar
    memberships,
    activeTenantId: active?.tenantId ?? "",
    activeTenantName: active?.tenantName ?? "",
    needsTenantSelection,
    subscription,
  };
}

const UNIT_MS = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000 };
const MAX_TIMER_MS = 2 ** 31 - 1;

/**
 * `expiresIn` -> milliseconds, or null when it can't be read with confidence.
 * A bare number is treated as seconds. A bare numeric string (e.g. "3600") is
 * ambiguous across JWT libraries, so it is NOT guessed.
 */
export function parseExpiresIn(value) {
  let ms = null;
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    ms = value * 1000;
  } else if (typeof value === "string") {
    const m = value.trim().match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w)$/i);
    if (m) ms = Number(m[1]) * UNIT_MS[m[2].toLowerCase()];
  }
  if (ms === null || ms <= 0) return null;
  return Math.min(ms, MAX_TIMER_MS);
}
