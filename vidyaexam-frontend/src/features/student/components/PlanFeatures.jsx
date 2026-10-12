import { Check, Minus, Sparkles } from "lucide-react";

const LABELS = {
  mock_tests: "Mock tests",
  basic_results: "Basic results",
  advanced_analytics: "Advanced analytics",
  answer_explanations: "Answer explanations",
  performance_history: "Performance history",
};

/** Respects the backend's feature flags exactly; unknown flags are ignored. */
export default function PlanFeatures({ subscription }) {
  const features = subscription?.features;
  const rows = features ? Object.keys(LABELS).filter((k) => k in features) : [];

  return (
    <section className="sd-card" aria-labelledby="sd-features-title">
      <h2 id="sd-features-title" className="sd-card__title">
        <Sparkles size={18} aria-hidden="true" /> What's in your plan
      </h2>
      {rows.length === 0 ? (
        <p className="sd-muted">Plan features aren't available right now.</p>
      ) : (
        <ul className="sd-features">
          {rows.map((k) => {
            const on = Boolean(features[k]);
            return (
              <li key={k} className={on ? "is-on" : "is-off"}>
                <span className="sd-features__mark" aria-hidden="true">
                  {on ? (
                    <Check size={14} strokeWidth={3} />
                  ) : (
                    <Minus size={14} strokeWidth={3} />
                  )}
                </span>
                <span>{LABELS[k]}</span>
                <small>{on ? "Included" : "Not in your plan"}</small>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
