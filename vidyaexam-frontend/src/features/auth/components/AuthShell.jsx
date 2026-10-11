import { Target, TrendingUp, Trophy } from "lucide-react";
import LogoImage from "./LogoImage";
import "../auth.css";

/**
 * Hero tone. "dark" = navy panel (use if your logo has light/white artwork).
 * "light" = soft teal-white panel (use if your logo is drawn in navy/teal for
 * light backgrounds). The logo itself is never boxed, filtered or recoloured.
 */
const HERO_TONE = "dark";

const BENEFITS = [
  {
    Icon: Target,
    title: "Practice with purpose",
    text: "Make every session count.",
  },
  {
    Icon: TrendingUp,
    title: "Track your progress",
    text: "See how far you've come.",
  },
  {
    Icon: Trophy,
    title: "Celebrate your milestones",
    text: "Recognise every step forward.",
  },
];

/** `wide` (optional) lets longer forms use a wider card; login pages omit it. */
export default function AuthShell({ children, wide = false }) {
  return (
    <div className="ve-auth">
      <aside className={`ve-auth__hero ve-auth__hero--${HERO_TONE}`}>
        {/* Decorative typography: hidden from assistive tech */}
        <div className="ve-auth__words" aria-hidden="true">
          <span>Learn</span>
          <span>Practice</span>
          <span>Achieve</span>
        </div>

        <LogoImage className="ve-auth__logo ve-auth__logo--hero" />

        <div className="ve-auth__hero-body">
          <h2 className="ve-auth__headline">
            <span>Your potential.</span>
            <span>Your preparation.</span>
            <span>Your next milestone.</span>
          </h2>
          <p className="ve-auth__lede">
            Turn consistent practice into confident performance. Build your
            knowledge, track your progress, and move closer to your goals.
          </p>

          <ul className="ve-auth__benefits">
            {BENEFITS.map(({ Icon, title, text }) => (
              <li key={title}>
                <span className="ve-auth__benefit-icon" aria-hidden="true">
                  <Icon size={18} strokeWidth={2} />
                </span>
                <span>
                  <strong>{title}</strong>
                  <small>{text}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="ve-auth__closing">
          Small steps. Consistent effort. Meaningful progress.
        </p>
      </aside>

      <main className="ve-auth__panel">
        <div className={`ve-auth__card${wide ? " ve-auth__card--wide" : ""}`}>
          <header className="ve-auth__mobilebrand">
            <LogoImage className="ve-auth__logo" />
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
