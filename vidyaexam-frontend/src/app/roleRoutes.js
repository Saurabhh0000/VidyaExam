
/**
 * Single source of truth for role -> landing page.
 *
 * Roles with implemented dashboards belong in ROLE_HOME.
 * Platform Super Admins use /super-admin/dashboard.
 * Organization Admins use /organization/dashboard.
 * Roles without an implemented dashboard return null.
 */

export const STUDENT_DASHBOARD = "/student/dashboard";
export const ORGANIZATION_DASHBOARD = "/organization/dashboard";
export const SUPER_ADMIN_DASHBOARD = "/super-admin/dashboard";

const ROLE_HOME = {
  STUDENT: STUDENT_DASHBOARD,
  ADMIN: ORGANIZATION_DASHBOARD,
  SUPER_ADMIN: SUPER_ADMIN_DASHBOARD,
};

/**
 * Returns the landing page for a role.
 *
 * @param {string | null | undefined} role
 * @returns {string | null}
 */
export const dashboardPathFor = (role) => {
  const normalizedRole = String(role ?? "").trim().toUpperCase();

  return ROLE_HOME[normalizedRole] ?? null;
};

/**
 * Extracts a role from the login API response.
 *
 * Standalone account:
 *   data.default_role = "STUDENT" | "SUPER_ADMIN"
 *
 * Organization account:
 *   data.memberships = [
 *     { role_name: "ADMIN", tenant_id: "..." }
 *   ]
 *
 * If multiple memberships exist, the user must explicitly select
 * an organization before a tenant-specific role can be determined.
 *
 * @param {object} result
 * @returns {string | null}
 */
export function getRoleFromLoginResult(result) {
  const data = result?.data ?? result;

  // Individual account, such as a student.
  if (data?.default_role) {
    return String(data.default_role).trim().toUpperCase();
  }

  // Organization memberships.
  const memberships = Array.isArray(data?.memberships)
    ? data.memberships
    : [];

  // Infer a role only when there is exactly one membership.
  if (memberships.length === 1) {
    const role = memberships[0]?.role_name;

    return String(role ?? "").trim().toUpperCase() || null;
  }

  // No membership or multiple memberships:
  // do not guess which tenant role should be active.
  return null;
}
