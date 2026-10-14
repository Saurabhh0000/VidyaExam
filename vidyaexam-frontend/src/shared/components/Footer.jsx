import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
} from "react-icons/fa6";
import { Link } from "react-router-dom";
import { logo, routes, socialLinks } from "../config/siteConfig";
import { dashboardPathFor } from "../../app/roleRoutes";
import useAuthState from "../../features/auth/utils/useAuthState";
import "../../styles/footer.css";

const platformLinks = [
  { label: "Explore Exams", href: "#exams" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how" },
];

const socialPlatforms = [
  { key: "linkedin", label: "LinkedIn", Icon: FaLinkedinIn },
  { key: "instagram", label: "Instagram", Icon: FaInstagram },
  { key: "facebook", label: "Facebook", Icon: FaFacebookF },
  { key: "twitter", label: "X (Twitter)", Icon: FaXTwitter },
];

export default function Footer() {
  const { isAuthenticated, user } = useAuthState();
  const role = user?.role?.toUpperCase();
  const dashboardPath = role ? dashboardPathFor(role) : null;
  const audience = !isAuthenticated
    ? "guest"
    : role === "STUDENT"
      ? "student"
      : role === "ADMIN"
        ? "organization"
        : "member";

  const legal = [
    routes.privacy && { label: "Privacy Policy", href: routes.privacy },
    routes.terms && { label: "Terms", href: routes.terms },
  ].filter(Boolean);

  const socials = socialPlatforms.filter(({ key }) => {
    const url = socialLinks?.[key];
    return typeof url === "string" && /^https:\/\//i.test(url.trim());
  });

  const accountLinks = isAuthenticated
    ? [
        dashboardPath && {
          label:
            audience === "organization"
              ? "Organization workspace"
              : "My dashboard",
          href: dashboardPath,
        },
      ].filter(Boolean)
    : [
        routes.login && { label: "Log in", href: routes.login },
        routes.register && { label: "Get started", href: routes.register },
      ].filter(Boolean);

  const exploreLinks =
    audience === "organization"
      ? [
          { label: "Organization dashboard", href: dashboardPath },
          { label: "Public home", href: routes.home },
        ].filter((item) => item.href)
      : audience === "student"
        ? [
            { label: "Student dashboard", href: dashboardPath },
            ...platformLinks.map(({ label, href }) => ({
              label,
              href: `${routes.home}${href}`,
            })),
          ].filter((item) => item.href)
        : platformLinks;

  const exploreTitle =
    audience === "organization"
      ? "Workspace"
      : audience === "student"
        ? "Learning"
        : "Explore";
  const hasSocial = socials.length > 0;

  return (
    <footer className={`site-footer site-footer--${audience}`}>
      <div className="site-footer__inner">
        <div
          className={`site-footer__grid${
            hasSocial ? "" : " site-footer__grid--no-social"
          }`}>
          <div className="site-footer__brand">
            <Link
              className="site-footer__logo-link"
              to={routes.home}
              aria-label="VidyaExam home">
              <img
                src={logo}
                alt="VidyaExam"
                className="site-footer__logo"
                loading="lazy"
              />
            </Link>
            <p className="site-footer__tagline">
              Empowering learning, achieving dreams.
            </p>
          </div>

          <nav className="site-footer__col" aria-label={exploreTitle}>
            <h2 className="site-footer__title">{exploreTitle}</h2>
            <ul className="site-footer__list">
              {exploreLinks.map(({ label, href }) => (
                <li key={`${label}:${href}`}>
                  {audience === "guest" && href.startsWith("#") ? (
                    <a className="site-footer__link" href={href}>{label}</a>
                  ) : (
                    <Link className="site-footer__link" to={href}>{label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {isAuthenticated && (
            <div className="site-footer__col">
              <h2 className="site-footer__title">
                {audience === "organization" ? "For your team" : "Your account"}
              </h2>
              <p className="site-footer__tagline">
                {audience === "organization"
                  ? "Keep your teaching team connected in one workspace."
                  : user?.name
                    ? `Welcome back, ${user.name}. Keep your preparation on track.`
                    : "Practice, prepare, and track your exam readiness."}
              </p>
            </div>
          )}

          <nav className="site-footer__col" aria-label="Account">
            <h2 className="site-footer__title">
              {isAuthenticated ? "Quick links" : "Your account"}
            </h2>
            <ul className="site-footer__list">
              {accountLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link className="site-footer__link" to={href}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          {hasSocial && (
            <div className="site-footer__col site-footer__social">
              <h2 className="site-footer__title">Follow us</h2>
              <ul className="site-footer__social-list">
                {socials.map(({ key, label, Icon }) => (
                  <li key={key}>
                    <a
                      className="site-footer__social-link"
                      href={socialLinks[key].trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`VidyaExam on ${label}`}>
                      <Icon size={18} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="site-footer__bottom">
          <span>© {new Date().getFullYear()} VidyaExam. All rights reserved.</span>
          {legal.length > 0 && (
            <span className="site-footer__legal">
              {legal.map(({ label, href }) => (
                <Link key={href} className="site-footer__link" to={href}>{label}</Link>
              ))}
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}
