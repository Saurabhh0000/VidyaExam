import { useEffect, useMemo, useRef, useState } from "react";
import { LogOut, Menu, X, LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { logo, routes, navLinks } from "../config/siteConfig";
import { resolveRoleNav } from "../config/headerNav";
import useHeaderUser from "../hooks/useHeaderUser";
import AppLink from "./AppLink";
import ProfileMenu, {
  AccountItem,
  AccountSummary,
  SubscriptionSummary,
  getSubscriptionSummary,
  prettifyRole,
} from "./ProfileMenu";
import { buildAccountItems } from "../config/accountMenu";
import "../../styles/header.css";
import "../../styles/profile-menu.css";

import { logout as logoutService } from "../../features/auth/services/auth.service";

export default function Header() {
  const navigate = useNavigate();
  const { status, user } = useHeaderUser();

  const authed = status === "authenticated" && Boolean(user);
  const loading = status === "loading";

  const roleNav = authed ? resolveRoleNav(user.role) : null;
  const roleLabel = authed ? (roleNav?.label ?? prettifyRole(user.role)) : "";

  const menuItems = useMemo(
    () => buildAccountItems(roleNav, user?.role),
    [roleNav, user?.role],
  );
  const subscription = authed ? getSubscriptionSummary(user) : null;
  const primaryNav = authed ? (roleNav?.nav ?? []) : navLinks;
  const homeTo = authed && roleNav?.dashboard ? roleNav.dashboard : routes.home;

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("top");
  const [loggingOut, setLoggingOut] = useState(false);

  const headerRef = useRef(null);
  const logoutInFlight = useRef(false);

  // Scroll-spy for public landing page navigation.
  useEffect(() => {
    if (authed || loading) return undefined;

    const targets = navLinks
      .map((link) => document.getElementById(link.id))
      .filter(Boolean);

    if (!targets.length || !("IntersectionObserver" in window)) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );

    targets.forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, [authed, loading]);

  // Escape closes the mobile menu.
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Close the mobile menu when the desktop layout is reached.
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 961px)");
    const onChange = (event) => {
      if (event.matches) setOpen(false);
    };

    mediaQuery.addEventListener("change", onChange);

    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  // Header shadow on scroll.
  useEffect(() => {
    const element = headerRef.current;
    if (!element) return undefined;

    let ticking = false;
    let scrolled = false;

    const update = () => {
      ticking = false;
      const next = window.scrollY > 8;

      if (next !== scrolled) {
        scrolled = next;
        element.dataset.scrolled = String(next);
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

  // Shared logout handler for desktop and mobile.
  async function handleLogout() {
    if (logoutInFlight.current) return;

    logoutInFlight.current = true;
    setLoggingOut(true);
    setOpen(false);

    try {
      // Use the existing shared session logout service.
      await logoutService();

      // Keep the header hook's logout contract in sync if it has extra logic.
      // The service above already ends the shared session.
      toast.success("You've logged out successfully!", {
        description: "Thanks for learning with VidyaExam. See you soon!",
        duration: 4000,
      });

      navigate(routes.home, { replace: true });
    } catch (error) {
      console.error("Sign out failed.", error);

      toast.error("We couldn't complete your sign out.", {
        description: "Please try again.",
        duration: 4000,
      });
    } finally {
      logoutInFlight.current = false;
      setLoggingOut(false);
    }
  }

  const tab = open ? 0 : -1;
  const closeMenu = () => setOpen(false);

  const renderPrimaryLink = (link, mobile) => {
    const common = {
      className: "nav-link",
      tabIndex: mobile ? tab : undefined,
      onClick: mobile ? closeMenu : undefined,
    };

    if (authed) {
      return (
        <AppLink key={link.to} to={link.to} end={link.end} nav {...common}>
          {link.label}
        </AppLink>
      );
    }

    const isActive = active === link.id;

    return (
      <a
        key={link.id}
        href={link.href}
        {...common}
        className={`nav-link${isActive ? " is-active" : ""}`}
        aria-current={isActive ? "true" : undefined}>
        {link.label}
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
          {primaryNav.map((link) => renderPrimaryLink(link, false))}
        </nav>

        <div className="header-actions">
          {loading && <span className="hdr-skeleton" aria-hidden="true" />}

          {authed && (
            <ProfileMenu
              user={user}
              roleLabel={roleLabel}
              items={menuItems}
              onLogout={handleLogout}
              loggingOut={loggingOut}
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
          onClick={() => setOpen((value) => !value)}>
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
          {primaryNav.map((link) => renderPrimaryLink(link, true))}

          {authed && (
            <div className="mobile-account">
              <AccountSummary user={user} roleLabel={roleLabel} />
              <SubscriptionSummary
                summary={subscription}
                onNavigate={closeMenu}
                tabIndex={tab}
              />

              {menuItems.map((item) => (
                <AccountItem
                  key={`${item.to ?? "soon"}:${item.label}`}
                  item={item}
                  tabIndex={tab}
                  onNavigate={closeMenu}
                />
              ))}

              <button
                type="button"
                className="menu-item menu-item--danger"
                tabIndex={tab}
                disabled={loggingOut}
                aria-busy={loggingOut}
                onClick={handleLogout}>
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
