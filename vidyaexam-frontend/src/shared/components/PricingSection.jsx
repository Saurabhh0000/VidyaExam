import { useId, useMemo, useState } from "react";
import { ArrowRight, Check, Minus, RotateCw } from "lucide-react";
import { routes } from "../config/siteConfig";
import usePlans from "../hooks/usePlans";
import {
  availableIntervals,
  ctaHref,
  formatPrice,
  humanize,
  intervalSuffix,
  planRows,
  visiblePlans,
} from "../utils/plans";

const CATEGORIES = [
  { id: "individual", label: "Individual Plans" },
  { id: "tenant", label: "Organization Plans" },
];

const ERROR_TEXT = {
  network: "We couldn't reach the server. Check your connection and try again.",
  timeout: "The request took too long. Please try again.",
  invalid: "We received an unexpected response. Please try again shortly.",
  http: "Plans are unavailable right now. Please try again shortly.",
};

function PlanCard({ plan, category, index }) {
  const isFree = plan.interval === "FREE";
  const rows = planRows(plan);
  const suffix = intervalSuffix(plan);

  return (
    <li className="hm-plan" style={{ "--i": index }}>
      <article aria-labelledby={`plan-${plan.id}`} className="hm-plan-card">
        <h3 id={`plan-${plan.id}`} className="hm-plan-name">
          {humanize(plan.name)}
        </h3>
        <p className="hm-plan-price">
          <span className="hm-plan-amount">
            {formatPrice(plan.price, plan.currency)}
          </span>
          {suffix && <span className="hm-plan-per">{suffix}</span>}
        </p>
        <p className="hm-plan-cycle">
          {isFree
            ? "Free plan"
            : `Billed ${humanize(plan.rawInterval).toLowerCase()}`}
        </p>

        <ul className="hm-plan-list">
          {rows.map((row) => (
            <li key={row.key} className={row.included ? "" : "is-off"}>
              {row.included ? (
                <Check size={16} aria-hidden="true" />
              ) : (
                <Minus size={16} aria-hidden="true" />
              )}
              <span>
                {row.label}
                {!row.included && (
                  <span className="hm-sr-only"> (not included)</span>
                )}
              </span>
            </li>
          ))}
        </ul>

        <a
          className={`hm-btn ${isFree ? "hm-btn--outline" : "hm-btn--primary"} hm-plan-cta`}
          href={ctaHref(routes.register, category)}>
          {isFree ? "Get started free" : "Get started"}
          <ArrowRight size={16} aria-hidden="true" />
          <span className="hm-sr-only">
            {" "}
            with the {humanize(plan.name)} plan
          </span>
        </a>
      </article>
    </li>
  );
}

function PlanSkeleton() {
  return (
    <ul className="hm-plans" aria-hidden="true">
      {[0, 1, 2].map((n) => (
        <li key={n} className="hm-plan">
          <div className="hm-plan-card hm-plan-card--skeleton">
            <span className="hm-skel hm-skel--sm" />
            <span className="hm-skel hm-skel--lg" />
            <span className="hm-skel" />
            <span className="hm-skel" />
            <span className="hm-skel" />
            <span className="hm-skel hm-skel--btn" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function PricingSection() {
  const { status, plans, errorKind, retry } = usePlans();
  const [category, setCategory] = useState("individual");
  const [preferred, setPreferred] = useState("MONTHLY");
  const uid = useId();

  const list = plans?.[category] ?? [];
  const available = useMemo(() => availableIntervals(list), [list]);
  const showToggle = available.MONTHLY && available.YEARLY;
  // If the chosen interval doesn't exist in this category, fall back to the one that does.
  const interval = available[preferred]
    ? preferred
    : available.MONTHLY
      ? "MONTHLY"
      : "YEARLY";
  const shown = useMemo(() => visiblePlans(list, interval), [list, interval]);

  const tabId = (id) => `${uid}-tab-${id}`;
  const panelId = `${uid}-panel`;

  const onTabKeyDown = (e) => {
    const i = CATEGORIES.findIndex((c) => c.id === category);
    let next = null;
    if (e.key === "ArrowRight") next = (i + 1) % CATEGORIES.length;
    else if (e.key === "ArrowLeft")
      next = (i - 1 + CATEGORIES.length) % CATEGORIES.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = CATEGORIES.length - 1;
    if (next === null) return;
    e.preventDefault();
    setCategory(CATEGORIES[next].id);
    document.getElementById(tabId(CATEGORIES[next].id))?.focus();
  };

  return (
    <section
      className="hm-section hm-section--surface"
      id="pricing"
      aria-labelledby="pricing-title">
      <div className="hm-container">
        <div className="hm-head reveal" data-reveal>
          <p className="hm-eyebrow">Simple, transparent plans</p>
          <h2 id="pricing-title">Choose the plan that moves you forward</h2>
          <p className="hm-lead">
            Individual plans are for learners preparing on their own.
            Organization plans are for institutions that manage examinations for
            their students and teachers.
          </p>
        </div>

        <div className="hm-pricing-controls">
          <div
            className="hm-seg"
            role="tablist"
            aria-label="Plan type"
            onKeyDown={onTabKeyDown}>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                id={tabId(c.id)}
                aria-selected={category === c.id}
                aria-controls={panelId}
                tabIndex={category === c.id ? 0 : -1}
                className="hm-seg-btn"
                onClick={() => setCategory(c.id)}>
                {c.label}
              </button>
            ))}
          </div>

          {status === "ready" && showToggle && (
            <fieldset className="hm-seg hm-billing">
              <legend className="hm-sr-only">Billing interval</legend>
              {[
                ["MONTHLY", "Monthly"],
                ["YEARLY", "Yearly"],
              ].map(([value, label]) => (
                <label key={value} className="hm-seg-opt">
                  <input
                    type="radio"
                    name={`${uid}-billing`}
                    value={value}
                    checked={interval === value}
                    onChange={() => setPreferred(value)}
                  />
                  <span className="hm-seg-btn">{label}</span>
                </label>
              ))}
            </fieldset>
          )}
        </div>

        <div
          id={panelId}
          role="tabpanel"
          aria-labelledby={tabId(category)}
          aria-busy={status === "loading"}
          className="hm-pricing-panel">
          {status === "loading" && <PlanSkeleton />}

          {status === "error" && (
            <div className="hm-pricing-state" role="alert">
              <p>{ERROR_TEXT[errorKind] ?? ERROR_TEXT.network}</p>
              <button
                type="button"
                className="hm-btn hm-btn--outline"
                onClick={retry}>
                <RotateCw size={16} aria-hidden="true" /> Try again
              </button>
            </div>
          )}

          {status === "ready" && shown.length === 0 && (
            <div className="hm-pricing-state">
              <p>No plans are available in this category right now.</p>
            </div>
          )}

          {status === "ready" && shown.length > 0 && (
            <ul className="hm-plans" key={`${category}-${interval}`}>
              {shown.map((plan, i) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  category={category}
                  index={i}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
