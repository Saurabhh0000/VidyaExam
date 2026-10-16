import {
  ORGANIZATION_DASHBOARD,
  STUDENT_DASHBOARD,
  SUPER_ADMIN_DASHBOARD,
} from "../../app/roleRoutes";

export const ROLE_NAV = {
  STUDENT: {
    label: "Student",
    // Keep the main student routes together in the workspace navigation.
    dashboard: STUDENT_DASHBOARD,
    nav: [
      { label: "Dashboard", to: STUDENT_DASHBOARD, icon: "dashboard", end: true },
      { label: "Settings", to: `${STUDENT_DASHBOARD}/settings`, icon: "settings", end: true },
    ],
  },
  ADMIN: {
    label: "Administrator",
    dashboard: ORGANIZATION_DASHBOARD,
    nav: [
      { label: "Dashboard", to: ORGANIZATION_DASHBOARD, icon: "dashboard", end: true },
      { label: "Employee", to: `${ORGANIZATION_DASHBOARD}/employee`, icon: "users" },
      { label: "Teacher", to: `${ORGANIZATION_DASHBOARD}/teacher`, icon: "teacher" },
      { label: "Student", to: `${ORGANIZATION_DASHBOARD}/student`, icon: "student" },
      {
        label: "Taxonomy",
        to: `${ORGANIZATION_DASHBOARD}/taxonomy`,
        icon: "taxonomy",
        children: [
          { label: "Subjects", to: `${ORGANIZATION_DASHBOARD}/taxonomy/subjects`, icon: "subject" },
          { label: "Topics", to: `${ORGANIZATION_DASHBOARD}/taxonomy/topics`, icon: "topic" },
        ],
      },
      { label: "Settings", to: `${ORGANIZATION_DASHBOARD}/settings`, icon: "settings", end: true },
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
      {
        label: "Taxonomy",
        to: `${SUPER_ADMIN_DASHBOARD}/taxonomy`,
        icon: "taxonomy",
        children: [
          { label: "Categories", to: `${SUPER_ADMIN_DASHBOARD}/taxonomy/categories`, icon: "category", roles: ["SUPER_ADMIN"] },
          { label: "Subjects", to: `${SUPER_ADMIN_DASHBOARD}/taxonomy/subjects`, icon: "subject", roles: ["SUPER_ADMIN", "ADMIN", "TEACHER"] },
          { label: "Topics", to: `${SUPER_ADMIN_DASHBOARD}/taxonomy/topics`, icon: "topic", roles: ["SUPER_ADMIN", "ADMIN", "TEACHER"] },
        ],
      },
      { label: "Reports & Analytics", to: `${SUPER_ADMIN_DASHBOARD}/analytics`, icon: "analytics", end: true },
      { label: "Platform Settings", to: `${SUPER_ADMIN_DASHBOARD}/settings`, icon: "settings", end: true },
    ],
  },
};

export function filterNavByRole(nav, role) {
  if (!Array.isArray(nav)) return [];
  const normalizedRole = String(role || "").trim().toUpperCase();

  return nav
    .filter((item) => {
      if (item.roles && !item.roles.includes(normalizedRole)) {
        return false;
      }
      return true;
    })
    .map((item) => {
      if (item.children && Array.isArray(item.children)) {
        const filteredChildren = item.children.filter((child) => {
          if (child.roles && !child.roles.includes(normalizedRole)) {
            return false;
          }
          return true;
        });
        return { ...item, children: filteredChildren };
      }
      return item;
    });
}

export function resolveRoleNav(role) {
  if (typeof role !== "string") return null;
  const normalizedRole = role.trim().toUpperCase();
  const config = ROLE_NAV[normalizedRole];
  if (!config) return null;

  return {
    ...config,
    nav: config.nav ? filterNavByRole(config.nav, normalizedRole) : undefined,
  };
}
