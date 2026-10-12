import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Pause,
  Play,
  TrendingUp,
} from "lucide-react";

const INTERVAL_MS = 7000;
const SWIPE_PX = 50;

function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(prefers-reduced-motion: reduce)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/**
 * `to` is the CTA destination. It is null on purpose: no mock-test, results or
 * exam pages exist yet. Set it (e.g. to: "/student/mock-tests") when they do and
 * the button appears. `note` comes only from the real subscription flags.
 */
function buildSlides(subscription) {
  const f = subscription?.features ?? null;
  const limit = subscription?.limits?.mock_tests_per_month;

  return [
    {
      id: "mock",
      Icon: ClipboardCheck,
      title: "Practise with mock tests",
      text: "Build exam-day confidence by working through full-length practice tests at your own pace.",
      note: !f
        ? null
        : f.mock_tests
          ? typeof limit === "number"
            ? `Included in your plan · up to ${limit} per month`
            : "Included in your plan"
          : "Not included in your current plan",
      to: null,
      cta: "Start practising",
    },
    {
      id: "progress",
      Icon: TrendingUp,
      title: "Track your progress",
      text: "Review your results to see where you're improving and which topics need more attention.",
      note: !f
        ? null
        : f.advanced_analytics
          ? "Advanced analytics included"
          : f.basic_results
            ? "Basic results included"
            : "Results aren't part of your current plan",
      to: null,
      cta: "View results",
    },
    {
      id: "habit",
      Icon: CalendarCheck,
      title: "Prepare consistently",
      text: "Short, regular sessions beat last-minute cramming. Make practice a daily habit.",
      note: null,
      to: null,
      cta: "Explore exams",
    },
  ];
}

export default function DashboardHeroSlider({ subscription }) {
  const slides = useMemo(() => buildSlides(subscription), [subscription]);
  const n = slides.length;
  const reduced = useReducedMotion();

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true); // the user's own choice
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const startX = useRef(null);

  // Rotation never runs while the user hovers/focuses, or when motion is reduced.
  const running = playing && !reduced && !hovered && !focused;

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % n), INTERVAL_MS);
    return () => clearInterval(id);
  }, [running, n]);

  // Any manual navigation permanently stops auto-rotation (until Play is pressed).
  const go = (i) => {
    setIndex((i + n) % n);
    setPlaying(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") go(index - 1);
    if (e.key === "ArrowRight") go(index + 1);
  };

  return (
    <section
      className="sd-hero"
      aria-roledescription="carousel"
      aria-label="Highlights"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
      onKeyDown={onKeyDown}>
      <div
        className="sd-hero__slides"
        aria-live={running ? "off" : "polite"}
        onPointerDown={(e) => (startX.current = e.clientX)}
        onPointerUp={(e) => {
          if (startX.current == null) return;
          const dx = e.clientX - startX.current;
          startX.current = null;
          if (Math.abs(dx) > SWIPE_PX) go(index + (dx < 0 ? 1 : -1));
        }}
        onPointerCancel={() => (startX.current = null)}>
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={`sd-slide${i === index ? " is-active" : ""}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${n}`}
            aria-hidden={i !== index}>
            <div className="sd-slide__copy">
              {s.note && <p className="sd-slide__note">{s.note}</p>}
              <h2 className="sd-slide__title">{s.title}</h2>
              <p className="sd-slide__text">{s.text}</p>
              {s.to && (
                <Link to={s.to} className="sd-btn sd-btn--light">
                  {s.cta}
                </Link>
              )}
            </div>
            <div className="sd-slide__visual" aria-hidden="true">
              <span className="sd-slide__tile">
                <s.Icon strokeWidth={1.6} />
              </span>
              <span className="sd-slide__bars">
                <i />
                <i />
                <i />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="sd-hero__controls">
        <div className="sd-hero__dots">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`sd-dot${i === index ? " is-active" : ""}`}
              aria-label={`Go to slide ${i + 1}: ${s.title}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => go(i)}
            />
          ))}
        </div>
        <div className="sd-hero__arrows">
          {!reduced && (
            <button
              type="button"
              className="sd-icon-btn"
              aria-label={
                playing
                  ? "Pause automatic rotation"
                  : "Start automatic rotation"
              }
              onClick={() => setPlaying((p) => !p)}>
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
          )}
          <button
            type="button"
            className="sd-icon-btn"
            aria-label="Previous slide"
            onClick={() => go(index - 1)}>
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="sd-icon-btn"
            aria-label="Next slide"
            onClick={() => go(index + 1)}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
