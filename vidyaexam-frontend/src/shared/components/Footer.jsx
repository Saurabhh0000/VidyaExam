import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
} from "react-icons/fa6";
import { logo, routes, socialLinks } from "../config/siteConfig";
import "../../styles/footer.css";

const platformLinks = [
  { label: "Explore Exams", href: "#exams" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how" },
];

// Keys must match the keys used in socialLinks (siteConfig.js)
const socialPlatforms = [
  { key: "linkedin", label: "LinkedIn", Icon: FaLinkedinIn },
  { key: "instagram", label: "Instagram", Icon: FaInstagram },
  { key: "facebook", label: "Facebook", Icon: FaFacebookF },
  { key: "twitter", label: "X (Twitter)", Icon: FaXTwitter },
];

export default function Footer() {
  const legal = [
    routes.privacy && { label: "Privacy Policy", href: routes.privacy },
    routes.terms && { label: "Terms", href: routes.terms },
  ].filter(Boolean);

  // Only platforms with a real, configured https URL are shown
  const socials = socialPlatforms.filter(({ key }) => {
    const url = socialLinks?.[key];
    return typeof url === "string" && /^https:\/\//i.test(url.trim());
  });
  const hasSocial = socials.length > 0;

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div
          className={`site-footer__grid${hasSocial ? "" : " site-footer__grid--no-social"}`}>
          <div className="site-footer__brand">
            <a
              className="site-footer__logo-link"
              href={routes.home}
              aria-label="VidyaExam home">
              <img
                src={logo}
                alt="VidyaExam"
                className="site-footer__logo"
                loading="lazy"
              />
            </a>
            <p className="site-footer__tagline">
              Prepare with purpose. Practice with confidence. Build exam
              readiness through structured mock tests and meaningful performance
              insights.
            </p>
          </div>

          <nav className="site-footer__col" aria-label="Platform">
            <h2 className="site-footer__title">Platform</h2>
            <ul className="site-footer__list">
              {platformLinks.map((l) => (
                <li key={l.href}>
                  <a className="site-footer__link" href={l.href}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="site-footer__col" aria-label="Account">
            <h2 className="site-footer__title">Account</h2>
            <ul className="site-footer__list">
              <li>
                <a className="site-footer__link" href={routes.login}>
                  Log In
                </a>
              </li>
              <li>
                <a className="site-footer__link" href={routes.register}>
                  Get Started
                </a>
              </li>
            </ul>
          </nav>

          {hasSocial && (
            <div className="site-footer__col site-footer__social">
              <h2 className="site-footer__title">Follow Us</h2>
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
          <span>
            © {new Date().getFullYear()} VidyaExam. All rights reserved.
          </span>
          {legal.length > 0 && (
            <span className="site-footer__legal">
              {legal.map((l) => (
                <a key={l.href} className="site-footer__link" href={l.href}>
                  {l.label}
                </a>
              ))}
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}
