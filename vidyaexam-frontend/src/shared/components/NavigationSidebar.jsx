import { useEffect, useRef, useState, useId } from "react";
import { createPortal } from "react-dom";
import {
  X,
  LogOut,
  LoaderCircle,
  LayoutDashboard,
  PanelLeftOpen,
} from "lucide-react";
import AppLink from "./AppLink";
import {
  AccountItem,
  AccountSummary,
  Avatar,
  SubscriptionSummary,
  MENU_ICONS,
} from "./ProfileMenu";
import useMediaQuery from "../hooks/useMediaQuery";

export const MOBILE_QUERY = "(max-width: 960px)";

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* Tooltip is portaled to <body> with fixed coordinates, so no overflow or
   stacking context inside the sidebar can clip it. Shown on hover and focus. */
function RailTip({ label, enabled, danger = false, children }) {
  const wrapRef = useRef(null);
  const [pos, setPos] = useState(null);
  const tipId = useId();

  useEffect(() => {
    if (!enabled) setPos(null);
  }, [enabled]);

  const show = () => {
    if (!enabled || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    setPos({ top: rect.top + rect.height / 2, left: rect.right + 14 });
  };
  const hide = () => setPos(null);

  return (
    <div
      ref={wrapRef}
      className="sidebar-nav-item-wrap"
      aria-describedby={enabled && pos ? tipId : undefined}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}>
      {children}
      {enabled &&
        pos &&
        createPortal(
          <div
            id={tipId}
            role="tooltip"
            className={`sidebar-floating-tooltip${danger ? " is-danger" : ""}`}
            style={{ top: pos.top, left: pos.left }}>
            {label}
          </div>,
          document.body,
        )}
    </div>
  );
}

export default function NavigationSidebar({
  id,
  isOpen,
  onToggle,
  onClose,
  logoSrc,
  homeTo,
  user,
  roleLabel,
  primaryNav,
  menuItems,
  subscription,
  loggingOut,
  onLogout,
}) {
  const asideRef = useRef(null);
  const closeBtnRef = useRef(null);
  const isMobile = useMediaQuery(MOBILE_QUERY);

  const collapsed = !isOpen;
  const showTips = collapsed && !isMobile;
  const isModal = isMobile && isOpen;

  // A closed mobile drawer is removed from the tab order and a11y tree.
  useEffect(() => {
    const node = asideRef.current;
    if (!node) return;
    if (isMobile && !isOpen) node.setAttribute("inert", "");
    else node.removeAttribute("inert");
  }, [isMobile, isOpen]);

  // Modal behaviour exists ONLY for the open mobile drawer:
  // Escape, Tab trap, scroll lock, initial focus. One effect, one cleanup.
  useEffect(() => {
    if (!isModal) return undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = asideRef.current?.querySelectorAll(FOCUSABLE);
      if (!nodes?.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const timer = setTimeout(() => closeBtnRef.current?.focus(), 60);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isModal, onClose]);

  const renderNavIcon = (link) => {
    const Icon = (link.icon && MENU_ICONS[link.icon]) || LayoutDashboard;
    return <Icon size={20} aria-hidden="true" />;
  };

  const handleNavigate = () => {
    if (isMobile) onClose();
  };

  return (
    <>
      {isMobile && (
        <div
          className={`sidebar-backdrop${isOpen ? " is-visible" : ""}`}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        id={id}
        ref={asideRef}
        aria-label="Application navigation"
        role={isModal ? "dialog" : undefined}
        aria-modal={isModal ? "true" : undefined}
        className={`app-sidebar ${isOpen ? "is-expanded" : "is-collapsed"}`}>
        {/* Header: same height as the navbar. The toggle never moves; branding
            appears beside it only while the sidebar is open. */}
        <div className="sidebar-header">
          <button
            ref={closeBtnRef}
            type="button"
            className={`sidebar-toggle-btn${isOpen && !isMobile ? " is-desktop-close" : ""}`}
            aria-expanded={isOpen}
            aria-controls={id}
            aria-label={
              isMobile
                ? "Close navigation"
                : isOpen
                  ? "Close sidebar"
                  : "Expand sidebar"
            }
            onClick={isMobile ? onClose : onToggle}>
            {isMobile ? (
              <X size={19} aria-hidden="true" />
            ) : isOpen ? (
              <X size={19} aria-hidden="true" />
            ) : (
              <PanelLeftOpen size={19} aria-hidden="true" />
            )}
          </button>

          {isOpen && (
            <AppLink
              to={homeTo}
              className="sidebar-brand"
              aria-label="VidyaExam home"
              onClick={handleNavigate}>
              <img src={logoSrc} alt="" className="sidebar-logo-img" />
            </AppLink>
          )}
        </div>

        <div className="sidebar-scrollable">
          {primaryNav?.length > 0 && (
            <div className="sidebar-group">
              {isOpen && <span className="sidebar-group-title">Workspace</span>}
              <nav className="sidebar-nav" aria-label="Workspace">
                {primaryNav.map((link) => (
                  <RailTip key={link.to} label={link.label} enabled={showTips}>
                    <AppLink
                      to={link.to}
                      end={link.end}
                      nav
                      className="sidebar-nav-item"
                      aria-label={collapsed ? link.label : undefined}
                      onClick={handleNavigate}>
                      <span className="sidebar-icon-wrap">
                        {renderNavIcon(link)}
                      </span>
                      {isOpen && (
                        <span className="sidebar-label">{link.label}</span>
                      )}
                    </AppLink>
                  </RailTip>
                ))}
              </nav>
            </div>
          )}

          <div className="sidebar-group sidebar-account-group">
            {isOpen && (
              <span className="sidebar-group-title">Account &amp; Tools</span>
            )}

            {isOpen ? (
              <div className="sidebar-account-overview">
                <AccountSummary user={user} roleLabel={roleLabel} />
                {subscription && (
                  <SubscriptionSummary
                    summary={subscription}
                    onNavigate={handleNavigate}
                  />
                )}
              </div>
            ) : (
              <RailTip label={user.name || user.email} enabled={showTips}>
                <div className="sidebar-avatar-mini-cell">
                  <Avatar user={user} />
                </div>
              </RailTip>
            )}

            <div className="sidebar-account-nav">
              {menuItems.map((item) => (
                <RailTip
                  key={`${item.to ?? "soon"}:${item.label}`}
                  label={item.label}
                  enabled={showTips}>
                  <AccountItem item={item} onNavigate={handleNavigate} />
                </RailTip>
              ))}
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <RailTip label="Sign out" enabled={showTips} danger>
            <button
              type="button"
              className="sidebar-logout-btn"
              disabled={loggingOut}
              aria-busy={loggingOut}
              aria-label={collapsed ? "Sign out" : undefined}
              onClick={onLogout}>
              <span className="sidebar-icon-wrap">
                {loggingOut ? (
                  <LoaderCircle
                    size={18}
                    className="profile-logout-spinner"
                    aria-hidden="true"
                  />
                ) : (
                  <LogOut size={18} aria-hidden="true" />
                )}
              </span>
              {isOpen && (
                <span className="sidebar-label">
                  {loggingOut ? "Signing out..." : "Sign out"}
                </span>
              )}
            </button>
          </RailTip>
        </div>
      </aside>
    </>
  );
}
