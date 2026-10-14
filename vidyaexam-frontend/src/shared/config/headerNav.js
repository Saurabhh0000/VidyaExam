import {
  ORGANIZATION_DASHBOARD,
  STUDENT_DASHBOARD,
  SUPER_ADMIN_DASHBOARD,
} from "../../app/roleRoutes";

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
    dashboard: ORGANIZATION_DASHBOARD,
    nav: [
      { label: "Dashboard", to: ORGANIZATION_DASHBOARD, icon: "dashboard", end: true },
      { label: "Employee", to: `${ORGANIZATION_DASHBOARD}/employee`, icon: "users" },
      { label: "Teacher", to: `${ORGANIZATION_DASHBOARD}/teacher`, icon: "teacher" },
      { label: "Student", to: `${ORGANIZATION_DASHBOARD}/student`, icon: "student" },
    ],
  },
  SUPER_ADMIN: {
    label: "Super Admin",
    dashboard: SUPER_ADMIN_DASHBOARD,
    nav: [
      { label: "Dashboard", to: SUPER_ADMIN_DASHBOARD, icon: "dashboard", end: true },
      { label: "Organizations / Tenants", to: `${SUPER_ADMIN_DASHBOARD}/organizations`, icon: "building", end: true },
      { label: "Users", to: `${SUPER_ADMIN_DASHBOARD}/users`, icon: "users", end: true },
      { label: "Teachers", to: `${SUPER_ADMIN_DASHBOARD}/teachers`, icon: "teacher", end: true },
      { label: "Students", to: `${SUPER_ADMIN_DASHBOARD}/students`, icon: "student", end: true },
      { label: "Subscriptions & Plans", to: `${SUPER_ADMIN_DASHBOARD}/subscriptions`, icon: "subscription", end: true },
      { label: "Reports & Analytics", to: `${SUPER_ADMIN_DASHBOARD}/analytics`, icon: "analytics", end: true },
      { label: "Platform Settings", to: `${SUPER_ADMIN_DASHBOARD}/settings`, icon: "settings", end: true },
    ],
  },
};

export function resolveRoleNav(role) {
  if (typeof role !== "string") return null;
  const normalizedRole = role.trim().toUpperCase();
  return Object.prototype.hasOwnProperty.call(ROLE_NAV, normalizedRole)
    ? ROLE_NAV[normalizedRole]
    : null;
}
