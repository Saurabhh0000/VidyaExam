import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Menu, PanelLeft, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "./ui/toast";

import { logo, routes, navLinks } from "../config/siteConfig";
import { resolveRoleNav } from "../config/headerNav";
import useHeaderUser from "../hooks/useHeaderUser";
import useMediaQuery from "../hooks/useMediaQuery";
import AppLink from "./AppLink";
import ProfileMenu, {
  getSubscriptionSummary,
  prettifyRole,
} from "./ProfileMenu";
import { buildAccountItems } from "../config/accountMenu";
import NavigationSidebar, { MOBILE_QUERY } from "./NavigationSidebar";
import NavigationDrawer from "./NavigationDrawer";
import "../../styles/header.css";
import "../../styles/profile-menu.css";

import { logout as logoutService } from "../../features/auth/services/auth.service";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, user } = useHeaderUser();
  const isMobile = useMediaQuery(MOBILE_QUERY);

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

  // Single source of truth: open = expanded (desktop) / drawer open (mobile).
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeLandingSection, setActiveLandingSection] = useState("top");
  const [loggingOut, setLoggingOut] = useState(false);

  const headerRef = useRef(null);
  const triggerBtnRef = useRef(null);
  const logoutInFlight = useRef(false);

  const brandHidden = authed && sidebarOpen;

  // Content offset on desktop (CSS applies the padding only above 960px).
  useEffect(() => {
    const cls = document.body.classList;
    cls.remove("has-sidebar-rail", "has-sidebar-expanded");
    if (authed)
      cls.add(sidebarOpen ? "has-sidebar-expanded" : "has-sidebar-rail");
    return () => cls.remove("has-sidebar-rail", "has-sidebar-expanded");
  }, [authed, sidebarOpen]);

  // Crossing the breakpoint resets state so a desktop-expanded sidebar never
  // turns into an open modal drawer (or vice versa).
  useEffect(() => {
    setSidebarOpen(false);
  }, [isMobile]);

  // Route change closes the mobile drawer; desktop keeps the user's choice.
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, location.hash, isMobile]);

  // Public landing page scroll-spy
  useEffect(() => {
    if (authed || loading) return undefined;

    const targets = navLinks
      .filter((link) => link.id !== "top")
      .map((link) => document.getElementById(link.id))
      .filter(Boolean);

    const syncTopSection = () => {
      if (window.scrollY <= 8) setActiveLandingSection("top");
    };
    syncTopSection();
    window.addEventListener("scroll", syncTopSection, { passive: true });

    if (!targets.length || !("IntersectionObserver" in window)) {
      return () => window.removeEventListener("scroll", syncTopSection);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveLandingSection(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );

    targets.forEach((target) => observer.observe(target));
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", syncTopSection);
    };
  }, [authed, loading]);

  // Elevation shadow on scroll
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

  const handleLogout = useCallback(async () => {
    if (logoutInFlight.current) return;
    logoutInFlight.current = true;
    setLoggingOut(true);
    setSidebarOpen(false);

    try {
      await logoutService();
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
  }, [navigate]);

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
    if (isMobile) triggerBtnRef.current?.focus();
  }, [isMobile]);

  return (
    <>
      <header
        className={`site-header ${authed ? "is-authed-header" : "is-guest-header"}`}
        ref={headerRef}
        data-scrolled="false">
        <div className="site-header__inner">
          <div className="header-left-cluster">
            {isMobile && authed && (
              <button
                ref={triggerBtnRef}
                type="button"
                className="sidebar-hamburger-trigger"
                aria-expanded={sidebarOpen}
                aria-controls="vidyaexam-navigation-sidebar"
                aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
                onClick={() => setSidebarOpen((prev) => !prev)}>
                <PanelLeft size={19} aria-hidden="true" />
              </button>
            )}

            {/* Keeps its layout box while hidden, so the navbar never shifts.
                Hidden = visibility:hidden + tabIndex -1 + aria-hidden. */}
            <AppLink
              to={homeTo}
              className={`header-logo-anchor${brandHidden ? " is-branding-hidden" : ""}`}
              tabIndex={brandHidden ? -1 : 0}
              aria-hidden={brandHidden || undefined}>
              <img
                src={logo}
                alt="VidyaExam Logo"
                className="header-main-logo"
              />
            </AppLink>
          </div>

          {!authed && !loading && (
            <nav className="header-pill-nav" aria-label="Landing Navigation">
              {navLinks.map((link) => {
                const isActive = activeLandingSection === link.id;
                return (
                  <a
                    key={link.id}
                    href={link.href}
                    className={`nav-pill-link${isActive ? " is-active" : ""}`}
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => setActiveLandingSection(link.id)}>
                    {link.label}
                  </a>
                );
              })}
            </nav>
          )}

          <div className="header-right-cluster">
            {isMobile && !authed && !loading && (
              <button
                ref={triggerBtnRef}
                type="button"
                className="sidebar-hamburger-trigger"
                aria-expanded={sidebarOpen}
                aria-controls="vidyaexam-guest-navigation-drawer"
                aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
                onClick={() => setSidebarOpen((prev) => !prev)}>
                <Menu size={20} aria-hidden="true" />
              </button>
            )}

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
              <div className="header-auth-group">
                <AppLink className="btn-modern-text" to={routes.login}>
                  Log in
                </AppLink>
                <AppLink className="btn-modern-solid" to={routes.register}>
                  <Sparkles size={15} aria-hidden="true" />
                  <span>Get Started</span>
                </AppLink>
              </div>
            )}
          </div>
        </div>
      </header>

      {authed && (
        <NavigationSidebar
          id="vidyaexam-navigation-sidebar"
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((prev) => !prev)}
          onClose={handleCloseSidebar}
          logoSrc={logo}
          homeTo={homeTo}
          user={user}
          roleLabel={roleLabel}
          primaryNav={primaryNav}
          menuItems={menuItems}
          subscription={subscription}
          loggingOut={loggingOut}
          onLogout={handleLogout}
        />
      )}

      {!authed && !loading && isMobile && (
        <NavigationDrawer
          id="vidyaexam-guest-navigation-drawer"
          isOpen={sidebarOpen}
          onClose={handleCloseSidebar}
          logoSrc={logo}
          homeTo={routes.home}
          authed={false}
          loading={false}
          primaryNav={navLinks}
          activeSectionId={activeLandingSection}
          menuItems={[]}
          subscription={null}
          loggingOut={false}
        />
      )}
    </>
  );
}
