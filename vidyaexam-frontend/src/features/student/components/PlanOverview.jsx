import {
  BadgeCheck,
  ChartColumn,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";

const titleCase = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/(^|[\s_])\w/g, (m) => m.toUpperCase())
    .replace(/_/g, " ");

/** Every value is read from the login response's subscription. Nothing is invented. */
export default function PlanOverview({ subscription }) {
  if (!subscription) {
    return (
      <section className="sd-card sd-card--note" aria-label="Plan overview">
        <p>Your plan details aren't available right now.</p>
      </section>
    );
  }

  const f = subscription.features ?? {};
  const limit = subscription.limits?.mock_tests_per_month;
  const results = f.advanced_analytics
    ? "Advanced analytics"
    : f.basic_results
      ? "Basic results"
      : "Not included";

  const items = [
    {
      Icon: BadgeCheck,
      label: "Current plan",
      value: subscription.plan_name ? titleCase(subscription.plan_name) : "—",
    },
    {
      Icon: ShieldCheck,
      label: "Plan status",
      value: subscription.status ? titleCase(subscription.status) : "—",
    },
    {
      Icon: ClipboardList,
      label: "Mock tests per month",
      value: typeof limit === "number" ? String(limit) : "—",
    },
    { Icon: ChartColumn, label: "Results", value: results },
  ];

  return (
    <ul className="sd-stats" aria-label="Plan overview">
      {items.map(({ Icon, label, value }) => (
        <li key={label} className="sd-stat">
          <span className="sd-stat__icon" aria-hidden="true">
            <Icon size={18} />
          </span>
          <span className="sd-stat__label">{label}</span>
          <strong className="sd-stat__value">{value}</strong>
        </li>
      ))}
    </ul>
  );
}
