import { useEffect, useMemo, useRef, useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { logo, routes, navLinks } from "../config/siteConfig";
import { resolveRoleNav } from "../config/headerNav";
import useHeaderUser from "../hooks/useHeaderUser";
import AppLink from "./AppLink";
import ProfileMenu, {
  AccountSummary,
  MENU_ICONS,
  prettifyRole,
} from "./ProfileMenu";
import "../../styles/header.css";

function buildMenuItems(roleNav) {
  if (!roleNav) return [];
  const items = [];
  if (roleNav.dashboard) {
    items.push({
      label: "My Dashboard",
      to: roleNav.dashboard,
      icon: "dashboard",
    });
  }
  return items.concat(roleNav.menu ?? []);
}

export default function Header() {
  const { status, user, logout } = useHeaderUser();
  const authed = status === "authenticated" && Boolean(user);
  const loading = status === "loading";
  // "unauthenticated" and "expired" both show the public header.

  const roleNav = authed ? resolveRoleNav(user.role) : null;
  const roleLabel = authed ? (roleNav?.label ?? prettifyRole(user.role)) : "";
  const menuItems = useMemo(() => buildMenuItems(roleNav), [roleNav]);
  const primaryNav = authed ? (roleNav?.nav ?? []) : navLinks;
  const homeTo = authed && roleNav?.dashboard ? roleNav.dashboard : routes.home;

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("top");
  const headerRef = useRef(null);

  // Scroll-spy: public landing navigation only. Authenticated links are
  // route-aware (NavLink), so no observer runs for them.
  useEffect(() => {
    if (authed || loading) return undefined;
    const targets = navLinks
      .map((l) => document.getElementById(l.id))
      .filter(Boolean);
    if (!targets.length || !("IntersectionObserver" in window))
      return undefined;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [authed, loading]);

  // Escape closes the mobile menu
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Close the menu if the viewport grows to the desktop layout
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 961px)");
    const onChange = (e) => e.matches && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Scrolled shadow: toggles a data attribute directly, so no React re-renders
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return undefined;
    let ticking = false;
    let scrolled = false;
    const update = () => {
      ticking = false;
      const next = window.scrollY > 8;
      if (next !== scrolled) {
        scrolled = next;
        el.dataset.scrolled = String(next);
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    try {
      await logout();
    } catch {
      console.error("Sign out failed.");
    }
  };

  const tab = open ? 0 : -1;
  const closeMenu = () => setOpen(false);

  const renderPrimaryLink = (l, mobile) => {
    const common = {
      className: "nav-link",
      tabIndex: mobile ? tab : undefined,
      onClick: mobile ? closeMenu : undefined,
    };
    if (authed) {
      return (
        <AppLink key={l.to} to={l.to} end={l.end} nav {...common}>
          {l.label}
        </AppLink>
      );
    }
    const isActive = active === l.id;
    return (
      <a
        key={l.id}
        href={l.href}
        {...common}
        className={`nav-link${isActive ? " is-active" : ""}`}
        aria-current={isActive ? "true" : undefined}>
        {l.label}
      </a>
    );
  };

  return (
    <header className="site-header" ref={headerRef} data-scrolled="false">
      <div className="site-header__inner">
        {authed && roleNav?.dashboard ? (
          <AppLink
            to={homeTo}
            className="logo-link"
            aria-label="VidyaExam dashboard">
            <img src={logo} alt="VidyaExam" className="header-logo" />
          </AppLink>
        ) : (
          <a className="logo-link" href={homeTo} aria-label="VidyaExam home">
            <img src={logo} alt="VidyaExam" className="header-logo" />
          </a>
        )}

        <nav className="nav-desktop" aria-label="Primary">
          {primaryNav.map((l) => renderPrimaryLink(l, false))}
        </nav>

        <div className="header-actions">
          {loading && <span className="hdr-skeleton" aria-hidden="true" />}
          {authed && (
            <ProfileMenu
              user={user}
              roleLabel={roleLabel}
              items={menuItems}
              onLogout={logout ? handleLogout : null}
            />
          )}
          {!authed && !loading && (
            <>
              <AppLink className="btn btn-ghost" to={routes.login}>
                Log In
              </AppLink>
              <AppLink className="btn btn-primary" to={routes.register}>
                Get Started
              </AppLink>
            </>
          )}
        </div>

        <button
          type="button"
          className="menu-btn"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}>
          {open ? (
            <X size={22} aria-hidden="true" />
          ) : (
            <Menu size={22} aria-hidden="true" />
          )}
        </button>
      </div>

      <div
        id="mobile-nav"
        className={`mobile-panel${open ? " is-open" : ""}`}
        aria-hidden={!open}>
        <nav className="mobile-nav" aria-label="Mobile">
          {primaryNav.map((l) => renderPrimaryLink(l, true))}

          {authed && (
            <div className="mobile-account">
              <AccountSummary user={user} roleLabel={roleLabel} />
              {menuItems.map(({ label, to, icon }) => {
                const Icon = MENU_ICONS[icon];
                return (
                  <AppLink
                    key={`${to}:${label}`}
                    to={to}
                    className="menu-item"
                    tabIndex={tab}
                    onClick={closeMenu}>
                    {Icon && <Icon size={18} aria-hidden="true" />}
                    {label}
                  </AppLink>
                );
              })}
              {logout && (
                <button
                  type="button"
                  className="menu-item menu-item--danger"
                  tabIndex={tab}
                  onClick={handleLogout}>
                  <LogOut size={18} aria-hidden="true" />
                  Sign out
                </button>
              )}
            </div>
          )}

          {!authed && !loading && (
            <div className="mobile-actions">
              <AppLink
                className="btn btn-ghost"
                to={routes.login}
                tabIndex={tab}
                onClick={closeMenu}>
                Log In
              </AppLink>
              <AppLink
                className="btn btn-primary"
                to={routes.register}
                tabIndex={tab}
                onClick={closeMenu}>
                Get Started
              </AppLink>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
