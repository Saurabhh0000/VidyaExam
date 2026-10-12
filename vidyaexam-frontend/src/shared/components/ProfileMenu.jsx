import { useEffect, useId, useRef, useState } from "react";
import {
  ChevronDown,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";
import AppLink from "./AppLink";

/** Icon keys a role config may use for a menu item. */
export const MENU_ICONS = {
  dashboard: LayoutDashboard,
  profile: UserRound,
  settings: Settings,
  help: CircleHelp,
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

export function Avatar({ user, large = false }) {
  const [failed, setFailed] = useState(false);
  const initials = getInitials(user.name, user.email);
  const showImage = Boolean(user.avatarUrl) && !failed;

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
        {roleLabel && <span className="role-badge">{roleLabel}</span>}
      </div>
    </div>
  );
}

/**
 * Account dropdown (menu-button pattern). Closed state is not rendered, so no
 * hidden item can take focus. Not a modal: Tab leaves the menu and closes it.
 */
export default function ProfileMenu({ user, roleLabel, items, onLogout }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();
  const displayName = user.name || user.email || "Account";

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

  // Move focus into the menu when it opens.
  useEffect(() => {
    if (open) menuRef.current?.querySelector('[role="menuitem"]')?.focus();
  }, [open]);

  const onMenuKeyDown = (e) => {
    const nodes = Array.from(
      menuRef.current?.querySelectorAll('[role="menuitem"]') ?? [],
    );
    if (!nodes.length) return;
    const index = nodes.indexOf(document.activeElement);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      nodes[(index + 1) % nodes.length].focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      nodes[(index - 1 + nodes.length) % nodes.length].focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      nodes[0].focus();
    } else if (e.key === "End") {
      e.preventDefault();
      nodes[nodes.length - 1].focus();
    } else if (e.key === "Tab") {
      // Non-modal: close and let Tab continue from the trigger.
      setOpen(false);
      buttonRef.current?.focus();
    }
  };

  const onTriggerKeyDown = (e) => {
    if (e.key === "ArrowDown" && !open) {
      e.preventDefault();
      setOpen(true);
    }
  };

  return (
    <div className="profile" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className="profile-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Account menu, ${displayName}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}>
        <Avatar user={user} />
        <span className="profile-name">{displayName}</span>
        <ChevronDown size={16} className="profile-chevron" aria-hidden="true" />
      </button>

      {open && (
        <div
          id={menuId}
          ref={menuRef}
          className="profile-menu"
          role="menu"
          aria-label="Account"
          onKeyDown={onMenuKeyDown}>
          <AccountSummary user={user} roleLabel={roleLabel} />
          {(items.length > 0 || onLogout) && <div className="menu-sep" />}

          {items.map(({ label, to, icon }) => {
            const Icon = MENU_ICONS[icon];
            return (
              <AppLink
                key={`${to}:${label}`}
                to={to}
                className="menu-item"
                role="menuitem"
                tabIndex={-1}
                onClick={() => setOpen(false)}>
                {Icon && <Icon size={18} aria-hidden="true" />}
                {label}
              </AppLink>
            );
          })}

          {onLogout && (
            <>
              {items.length > 0 && <div className="menu-sep" />}
              <button
                type="button"
                className="menu-item menu-item--danger"
                role="menuitem"
                tabIndex={-1}
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}>
                <LogOut size={18} aria-hidden="true" />
                Sign out
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
