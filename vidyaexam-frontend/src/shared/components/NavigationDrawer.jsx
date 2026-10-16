import { useEffect, useRef } from "react";
import { X, LogOut } from "lucide-react";
import AppLink from "./AppLink";
import { routes } from "../config/siteConfig";
import {
  AccountItem,
  AccountSummary,
  SubscriptionSummary,
} from "./ProfileMenu";

export default function NavigationDrawer({
  id,
  isOpen,
  onClose,
  logoSrc,
  homeTo,
  authed,
  loading,
  user,
  roleLabel,
  primaryNav,
  activeSectionId,
  menuItems,
  subscription,
  loggingOut,
  onLogout,
}) {
  const drawerRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Background scroll lock
  useEffect(() => {
    if (!isOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  // Escape key & focus trapping inside the drawer
  useEffect(() => {
    if (!isOpen) return undefined;

    const drawerNode = drawerRef.current;
    if (!drawerNode) return undefined;

    // Focus close button on open
    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key === "Tab") {
        const focusableElements = drawerNode.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );

        if (!focusableElements.length) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const tabIndex = isOpen ? 0 : -1;

  return (
    <div
      className={`drawer-wrapper ${isOpen ? "is-open" : ""}`}
      aria-hidden={!isOpen}>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />

      <aside
        id={id}
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className="drawer-panel">
        <div className="drawer-header">
          <AppLink
            to={homeTo}
            className="drawer-logo-link"
            aria-label="VidyaExam home"
            tabIndex={tabIndex}
            onClick={onClose}>
            <img src={logoSrc} alt="VidyaExam" className="drawer-logo" />
          </AppLink>

          <button
            ref={closeButtonRef}
            type="button"
            className="drawer-close-btn"
            aria-label="Close navigation menu"
            tabIndex={tabIndex}
            onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="drawer-content">
          <nav className="drawer-nav" aria-label="Drawer Navigation">
            <div className="drawer-section-label">Navigation</div>
            {primaryNav.map((link) => {
              if (authed) {
                const hasChildren = Boolean(link.children?.length);
                if (hasChildren) {
                  return (
                    <div key={link.to} className="drawer-nav-group">
                      <div className="drawer-nav-group-title">{link.label}</div>
                      <div className="drawer-nav-group-children">
                        {link.children.map((child) => (
                          <AppLink
                            key={child.to}
                            to={child.to}
                            nav
                            className="drawer-nav-link drawer-sub-link"
                            tabIndex={tabIndex}
                            onClick={onClose}>
                            {child.label}
                          </AppLink>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <AppLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    nav
                    className="drawer-nav-link"
                    tabIndex={tabIndex}
                    onClick={onClose}>
                    {link.label}
                  </AppLink>
                );
              }

              const isActive = activeSectionId === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  className={`drawer-nav-link${isActive ? " is-active" : ""}`}
                  aria-current={isActive ? "true" : undefined}
                  tabIndex={tabIndex}
                  onClick={onClose}>
                  {link.label}
                </a>
              );
            })}
          </nav>

          {authed && (
            <div className="drawer-account-section">
              <div className="drawer-section-label">Account</div>
              <AccountSummary user={user} roleLabel={roleLabel} />

              <SubscriptionSummary
                summary={subscription}
                onNavigate={onClose}
                tabIndex={tabIndex}
              />

              <div className="drawer-account-items">
                {menuItems.map((item) => (
                  <AccountItem
                    key={`${item.to ?? "soon"}:${item.label}`}
                    item={item}
                    tabIndex={tabIndex}
                    onNavigate={onClose}
                  />
                ))}
              </div>

              <button
                type="button"
                className="drawer-logout-btn"
                tabIndex={tabIndex}
                disabled={loggingOut}
                aria-busy={loggingOut}
                onClick={onLogout}>
                <LogOut size={18} aria-hidden="true" />
                <span>{loggingOut ? "Signing out..." : "Sign out"}</span>
              </button>
            </div>
          )}

          {!authed && !loading && (
            <div className="drawer-auth-actions">
              <AppLink
                className="btn btn-ghost drawer-btn"
                to={routes.login}
                tabIndex={tabIndex}
                onClick={onClose}>
                Log In
              </AppLink>

              <AppLink
                className="btn btn-primary drawer-btn"
                to={routes.register}
                tabIndex={tabIndex}
                onClick={onClose}>
                Get Started
              </AppLink>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
