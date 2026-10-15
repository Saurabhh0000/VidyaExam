import { useEffect, useId, useRef, useState } from "react";
import {
  ChevronDown,
  CircleHelp,
  CreditCard,
  Building2,
  ChartNoAxesCombined,
  BookOpen,
  GraduationCap,
  History,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Settings,
  TrendingUp,
  UserRound,
  Users,
  FolderTree,
  Layers,
  Library,
  FileText,
} from "lucide-react";
import AppLink from "./AppLink";
import useMediaQuery from "../hooks/useMediaQuery";
import { READY_ROUTES } from "../config/accountMenu";

/** Icon keys a role config may use for a menu item. */
export const MENU_ICONS = {
  dashboard: LayoutDashboard,
  profile: UserRound,
  settings: Settings,
  help: CircleHelp,
  history: History,
  performance: TrendingUp,
  subscription: CreditCard,
  users: Users,
  teacher: BookOpen,
  student: GraduationCap,
  building: Building2,
  analytics: ChartNoAxesCombined,
  taxonomy: FolderTree,
  category: Layers,
  subject: Library,
  topic: FileText,
};

export function getInitials(name, email) {
  const source = (name || "").trim() || (email || "").split("@")[0].trim();
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (!parts.length) return "";
  const first = Array.from(parts[0])[0];
  const last = parts.length > 1 ? Array.from(parts[parts.length - 1])[0] : "";
  return `${first}${last}`.toUpperCase();
}

export function prettifyRole(role) {
  if (typeof role !== "string" || !role.trim()) return "";
  return role
    .trim()
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}

/**
 * Reads ONLY what the session provides (assumed keys: plan_name, plan_scope,
 * status; camelCase also accepted). Returns null when there is nothing real to
 * show. Students never see a non-individual (tenant) plan here.
 */
export function getSubscriptionSummary(user) {
  const sub = user?.subscription;
  if (!sub || typeof sub !== "object") return null;

  const plan = sub.plan_name ?? sub.planName ?? sub.name;
  if (!plan) return null;

  const scope = sub.plan_scope ?? sub.planScope ?? "";
  const isStudent = String(user?.role ?? "").toUpperCase() === "STUDENT";
  if (isStudent && scope && String(scope).toUpperCase() !== "INDIVIDUAL")
    return null;

  return {
    plan: prettifyRole(String(plan)),
    scope: prettifyRole(String(scope)),
    status: prettifyRole(String(sub.status ?? "")),
    active: String(sub.status ?? "").toUpperCase() === "ACTIVE",
  };
}

export function Avatar({ user, large = false, initialsOnly = false }) {
  const [failed, setFailed] = useState(false);
  const initials = getInitials(user.name, user.email);
  const showImage = !initialsOnly && Boolean(user.avatarUrl) && !failed;

  return (
    <span className={`avatar${large ? " avatar--lg" : ""}`} aria-hidden="true">
      {showImage ? (
        <img src={user.avatarUrl} alt="" onError={() => setFailed(true)} />
      ) : initials ? (
        initials
      ) : (
        <UserRound size={large ? 22 : 18} />
      )}
    </span>
  );
}

export function AccountSummary({ user, roleLabel }) {
  return (
    <div className="account-summary">
      <Avatar user={user} large />
      <div className="account-meta">
        <strong title={user.name || undefined}>
          {user.name || user.email || "Your account"}
        </strong>
        {user.name && user.email && (
          <span className="account-email" title={user.email}>
            {user.email}
          </span>
        )}
        {user.activeTenantName && (
          <span className="account-tenant" title={user.activeTenantName}>
            {user.activeTenantName}
          </span>
        )}
        {roleLabel && <span className="role-badge">{roleLabel}</span>}
      </div>
    </div>
  );
}

/** Compact plan card. "View plan" only appears once a real route is configured. */
export function SubscriptionSummary({ summary, onNavigate, tabIndex }) {
  if (!summary) return null;
  const to = READY_ROUTES.subscription;

  return (
    <section className="sub-card" aria-label="Subscription">
      <div className="sub-card__row">
        <span className="sub-card__icon" aria-hidden="true">
          <CreditCard size={18} />
        </span>
        <div className="sub-card__body">
          <span className="sub-card__label">Current plan</span>
          <strong className="sub-card__plan">
            {summary.plan}
            {summary.scope && <small>{summary.scope}</small>}
          </strong>
        </div>
        {summary.status && (
          <span
            className={`sub-card__status${summary.active ? " is-active" : ""}`}>
            {summary.active && <i aria-hidden="true" />}
            {summary.status}
          </span>
        )}
      </div>
      {to && (
        <AppLink
          to={to}
          className="sub-card__link"
          tabIndex={tabIndex}
          onClick={onNavigate}>
          View plan
        </AppLink>
      )}
    </section>
  );
}

/** One row. Items without a route render as inert "Soon" text, never as links. */
export function AccountItem({ item, onNavigate, tabIndex }) {
  const Icon = MENU_ICONS[item.icon];

  if (item.disabled || !item.to) {
    return (
      <span className="menu-item is-disabled">
        {Icon && <Icon size={18} aria-hidden="true" />}
        {item.label}
        <em className="menu-soon">Soon</em>
      </span>
    );
  }

  return (
    <AppLink
      to={item.to}
      className="menu-item"
      tabIndex={tabIndex}
      onClick={onNavigate}>
      {Icon && <Icon size={18} aria-hidden="true" />}
      {item.label}
    </AppLink>
  );
}

/**
 * Account dropdown (disclosure pattern). The panel stays mounted so it can
 * animate out, but while closed it is visibility:hidden, so nothing inside can
 * be focused, tabbed to or read. Esc / outside click / Tab-out all close it.
 */
export default function ProfileMenu({
  user,
  roleLabel,
  items,
  onLogout,
  loggingOut = false,
}) {
  const compactProfile = useMediaQuery("(max-width: 960px)");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);
  const menuId = useId();
  const displayName = user.name || user.email || "Account";
  const subscription = getSubscriptionSummary(user);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div
      className="profile"
      ref={wrapRef}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}>
      <button
        ref={buttonRef}
        type="button"
        className="profile-trigger"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Account menu, ${displayName}`}
        onClick={() => setOpen((v) => !v)}>
        <Avatar user={user} initialsOnly={compactProfile} />
        <span className="profile-id">
          <span className="profile-name">{displayName}</span>
          {roleLabel && <span className="profile-role">{roleLabel}</span>}
        </span>
        <ChevronDown size={16} className="profile-chevron" aria-hidden="true" />
      </button>

      <div
        id={menuId}
        className="profile-menu"
        data-open={open}
        aria-label="Account">
        <AccountSummary user={user} roleLabel={roleLabel} />
        <SubscriptionSummary summary={subscription} onNavigate={close} />

        {items.length > 0 && (
          <>
            <div className="menu-sep" />
            <div className="menu-group">
              {items.map((item) => (
                <AccountItem
                  key={`${item.to ?? "soon"}:${item.label}`}
                  item={item}
                  onNavigate={close}
                />
              ))}
            </div>
          </>
        )}

        {onLogout && (
          <>
            <div className="menu-sep" />
            <button
              type="button"
              className="menu-item menu-item--danger"
              disabled={loggingOut}
              aria-busy={loggingOut}
              onClick={onLogout}>
              {loggingOut ? (
                <LoaderCircle
                  size={18}
                  className="profile-logout-spinner"
                  aria-hidden="true"
                />
              ) : (
                <LogOut size={18} aria-hidden="true" />
              )}
              {loggingOut ? "Signing out..." : "Sign out"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
