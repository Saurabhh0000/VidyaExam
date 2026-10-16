import { useEffect, useRef, useState, useId } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import {
  X,
  LogOut,
  LayoutDashboard,
  PanelLeftOpen,
  ChevronRight,
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
  const location = useLocation();

  const [openMenus, setOpenMenus] = useState(() => {
    const initial = {};
    primaryNav?.forEach((item) => {
      if (item.children?.length && location.pathname.startsWith(item.to)) {
        initial[item.to] = true;
      }
    });
    return initial;
  });

  useEffect(() => {
    primaryNav?.forEach((item) => {
      if (item.children?.length && location.pathname.startsWith(item.to)) {
        setOpenMenus((prev) => ({ ...prev, [item.to]: true }));
      }
    });
  }, [location.pathname, primaryNav]);

  const toggleMenu = (to) => {
    setOpenMenus((prev) => ({ ...prev, [to]: !prev[to] }));
  };

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
              {isOpen && <span className="sidebar-group-title">WORKSPACE</span>}
              <nav className="sidebar-nav" aria-label="Workspace">
                {primaryNav.map((link) => {
                  const hasChildren = Boolean(link.children?.length);
                  const isMenuOpen = Boolean(openMenus[link.to]);
                  const isParentActive = location.pathname.startsWith(link.to);

                  if (hasChildren && isOpen) {
                    return (
                      <div
                        key={link.to}
                        className={`sidebar-parent-group ${
                          isParentActive ? "is-active-parent" : ""
                        }`}>
                        <button
                          type="button"
                          className={`sidebar-nav-item sidebar-parent-btn ${
                            isParentActive ? "is-parent-selected" : ""
                          }`}
                          onClick={() => toggleMenu(link.to)}
                          aria-expanded={isMenuOpen}>
                          <span className="sidebar-icon-wrap">
                            {renderNavIcon(link)}
                          </span>
                          <span className="sidebar-label">{link.label}</span>
                          <ChevronRight
                            size={16}
                            className={`sidebar-chevron ${
                              isMenuOpen ? "is-open" : ""
                            }`}
                            aria-hidden="true"
                          />
                        </button>
                        {isMenuOpen && (
                          <div
                            className="sidebar-sub-nav"
                            role="group"
                            aria-label={link.label}>
                            {link.children.map((child) => (
                              <AppLink
                                key={child.to}
                                to={child.to}
                                nav
                                className="sidebar-sub-item"
                                onClick={handleNavigate}>
                                <span className="sidebar-sub-icon-wrap">
                                  {renderNavIcon(child)}
                                </span>
                                <span className="sidebar-sub-label">
                                  {child.label}
                                </span>
                              </AppLink>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <RailTip
                      key={link.to}
                      label={link.label}
                      enabled={showTips}>
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
                  );
                })}
              </nav>
            </div>
          )}

          <div className="sidebar-group sidebar-account-group">
            {isOpen && (
              <span className="sidebar-group-title">ACCOUNT &amp; TOOLS</span>
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
                <LogOut size={18} aria-hidden="true" />
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
