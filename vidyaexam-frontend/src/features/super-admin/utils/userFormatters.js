import { formatDate } from "./tenantFormatters";

export function formatRole(role) {
  if (!role || role === "UNASSIGNED") return "General User";
  switch (String(role).toUpperCase()) {
    case "STUDENT":
      return "Student";
    case "TEACHER":
      return "Teacher";
    case "ADMIN":
      return "Organization Admin";
    case "SUPER_ADMIN":
      return "Super Admin";
    default:
      return String(role).replaceAll("_", " ");
  }
}

export function getRoleBadgeClass(role) {
  if (!role) return "is-unassigned";
  switch (String(role).toUpperCase()) {
    case "STUDENT":
      return "is-student";
    case "TEACHER":
      return "is-teacher";
    case "ADMIN":
      return "is-admin";
    case "SUPER_ADMIN":
      return "is-super";
    default:
      return "is-unassigned";
  }
}

export function formatLastLogin(dateVal) {
  if (!dateVal) return "Never logged in";
  const date = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (Number.isNaN(date.getTime())) return "Never logged in";

  return formatDate(date, true);
}
