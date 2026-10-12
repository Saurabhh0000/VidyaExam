/**
 * Single source of truth for role -> landing page.
 * Only routes that actually exist belong here. Roles without a built dashboard
 * (e.g. organization admins) are intentionally absent and fall back to "/".
 */
export const STUDENT_DASHBOARD = "/student/dashboard";

const ROLE_HOME = {
  STUDENT: STUDENT_DASHBOARD,
};

export const dashboardPathFor = (role) =>
  ROLE_HOME[String(role ?? "").toUpperCase()] ?? null;

/**
 * ASSUMPTION — where the role sits in the login response. Confirm against the
 * real payload; this is the only place that needs to change.
 */

export function getRoleFromLoginResult(result) {
  const data = result?.data ?? result;

  // Individual account, such as a student.
  if (data?.default_role) {
    return String(data.default_role).toUpperCase();
  }

  // Tenant account: infer a role only when there is exactly one membership.
  const memberships = Array.isArray(data?.memberships)
    ? data.memberships
    : [];

  if (memberships.length === 1) {
    return String(memberships[0]?.role_name ?? "").toUpperCase() || null;
  }

  // Multiple memberships require an explicit tenant selection.
  return null;
}
