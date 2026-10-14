/**
 * Account-menu configuration. Nothing here invents a route.
 *
 * READY_ROUTES: set a key to its real path ONLY once that page exists in your
 * router. Until then the matching item is hidden (or shown disabled as "Soon"
 * when SHOW_UPCOMING is true). Reuses resolveRoleNav(): its dashboard + menu
 * entries are always included, so role-specific items stay in headerNav.js.
 */
export const READY_ROUTES = {
  history: null, // e.g. "/student/history"
  performance: null, // e.g. "/student/performance"
  subscription: null, // e.g. "/student/subscription"
};

/** true = also show not-yet-built items as disabled "Soon" rows. */
export const SHOW_UPCOMING = false;

const UPCOMING_BY_ROLE = {
  STUDENT: [
    { key: "history", label: "My Test History", icon: "history" },
    { key: "performance", label: "My Performance", icon: "performance" },
    { key: "subscription", label: "My Subscription", icon: "subscription" },
  ],
};

export function buildAccountItems(roleNav, role) {
  if (!roleNav) return [];

  const items = [];
  const dashboardIsInPrimaryNav = roleNav.nav?.some(
    (item) => item.to === roleNav.dashboard,
  );
  if (roleNav.dashboard && !dashboardIsInPrimaryNav) {
    items.push({ label: "My Dashboard", to: roleNav.dashboard, icon: "dashboard" });
  }
  items.push(...(roleNav.menu ?? []));

  const planned = UPCOMING_BY_ROLE[String(role ?? "").toUpperCase()] ?? [];
  for (const { key, label, icon } of planned) {
    const to = READY_ROUTES[key] ?? null;
    if (to) {
      if (!items.some((i) => i.to === to)) items.push({ label, to, icon });
    } else if (SHOW_UPCOMING) {
      items.push({ label, icon, disabled: true });
    }
  }
  return items;
}
