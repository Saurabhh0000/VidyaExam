import { STUDENT_DASHBOARD } from "../../app/roleRoutes";

export const ROLE_NAV = {
  STUDENT: {
    label: "Student",
    // Real route. The profile menu adds "My Dashboard" from this, and the logo links here.
    dashboard: STUDENT_DASHBOARD,
    // No `nav`: a "Dashboard" link here would duplicate the menu's "My Dashboard"
    // (the mobile drawer shows both lists together).
  },
  ADMIN: {
    label: "Administrator",
    // No admin dashboard page exists yet. Add `dashboard` when it does.
  },
};

export function resolveRoleNav(role) {
  if (typeof role !== "string") return null;
  return Object.prototype.hasOwnProperty.call(ROLE_NAV, role)
    ? ROLE_NAV[role]
    : null;
}