/**
 * Role → header navigation. Keep permissions/navigation data here, not in JSX.
 *
 * Keys are the exact role strings from the login response: `data.default_role`
 * for individual accounts and `data.memberships[].role_name` for organization
 * members. STUDENT and ADMIN are confirmed by real responses; add others only
 * when they exist.
 *
 * ROUTES ARE NOT FILLED IN. The router wasn't available, and links to pages
 * that don't exist would be dead links. For each role add, using real paths:
 *   dashboard  Route of the role's dashboard (logo link + "My Dashboard").
 *   nav        Primary links: [{ label, to, end? }]  (`end: true` = exact match).
 *   menu       Extra profile-menu items: [{ label, to, icon }], icon being
 *              "profile" | "settings" | "help".
 *
 * Example once the routes exist (illustrative paths):
 *
 *   STUDENT: {
 *     label: "Student",
 *     dashboard: "/student",
 *     nav: [
 *       { label: "Dashboard", to: "/student", end: true },
 *       { label: "Exams", to: "/student/exams" },
 *     ],
 *   },
 *
 * A role with no entry (or a missing role) gets no links beyond the profile
 * menu and Sign out. This file only controls what the header shows; the backend
 * and protected routes still decide what a user may do.
 */
export const ROLE_NAV = {
  STUDENT: {
    label: "Student",
  },
  ADMIN: {
    label: "Administrator",
  },
};

export function resolveRoleNav(role) {
  if (typeof role !== "string") return null;
  return Object.prototype.hasOwnProperty.call(ROLE_NAV, role)
    ? ROLE_NAV[role]
    : null;
}