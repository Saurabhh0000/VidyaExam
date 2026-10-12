/**
 * Pure helpers for the subscription plans API. No React, no network.
 * Everything shown to users is derived from the API response: no plan, price,
 * feature or limit is defined here.
 *
 * Response contract (GET subscriptions/plans):
 *   { success, message, count, data: { individual: Plan[], tenant: Plan[] } }
 *   Plan: { plan_id, plan_name, plan_scope, billing_interval, price_amount,
 *           currency, features, limits }
 *
 * `features` is read as { key: boolean | number | string } and `limits` as
 * { key: number } (-1 = unlimited). An array of strings is also tolerated for
 * `features`. Keys are humanized for display and never shown raw.
 */

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

/** "mock_tests_per_month" / "mockTestsPerMonth" -> "Mock tests per month" */
export function humanize(key) {
  const words = String(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_\-\s]+/g, " ")
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const intervalOf = (raw, price) => {
  const v = String(raw ?? "").trim().toUpperCase();
  if (price === 0 || v === "FREE") return "FREE";
  if (v.startsWith("MONTH")) return "MONTHLY";
  if (v.startsWith("YEAR") || v.startsWith("ANNUAL")) return "YEARLY";
  return "OTHER";
};

function normalizePlan(raw) {
  if (!isObject(raw)) return null;
  const name = typeof raw.plan_name === "string" ? raw.plan_name.trim() : "";
  const price = Number(raw.price_amount);
  if (!name || !Number.isFinite(price) || price < 0) return null;
  return {
    id: String(raw.plan_id ?? `${name}:${raw.billing_interval}`),
    name,
    scope: raw.plan_scope ?? "",
    rawInterval: raw.billing_interval ?? "",
    interval: intervalOf(raw.billing_interval, price),
    price,
    currency: typeof raw.currency === "string" && raw.currency ? raw.currency : "INR",
    features: raw.features ?? null,
    limits: isObject(raw.limits) ? raw.limits : null,
  };
}

/**
 * Validates and normalizes the response. Returns { individual, tenant } or
 * throws Error("invalid") if the shape isn't what the contract promises.
 */
export function normalizePlansResponse(json) {
  if (!isObject(json) || json.success === false || !isObject(json.data)) {
    throw new Error("invalid");
  }
  const { individual, tenant } = json.data;
  if (!Array.isArray(individual) || !Array.isArray(tenant)) {
    throw new Error("invalid");
  }
  const clean = (list) => list.map(normalizePlan).filter(Boolean);
  return { individual: clean(individual), tenant: clean(tenant) };
}

/** Which paid intervals a category offers. */
export function availableIntervals(plans) {
  return {
    MONTHLY: plans.some((p) => p.interval === "MONTHLY"),
    YEARLY: plans.some((p) => p.interval === "YEARLY"),
  };
}

/**
 * Plans to show for a category + interval: free plans once (de-duplicated by
 * name), then paid plans for the chosen interval, cheapest first. Plans whose
 * interval isn't monthly/yearly are kept visible rather than silently dropped.
 */
export function visiblePlans(plans, interval) {
  const seenFree = new Set();
  const free = plans.filter((p) => {
    if (p.interval !== "FREE") return false;
    const k = p.name.toUpperCase();
    if (seenFree.has(k)) return false;
    seenFree.add(k);
    return true;
  });
  const paid = plans
    .filter((p) => p.interval === interval || p.interval === "OTHER")
    .sort((a, b) => a.price - b.price);
  return [...free, ...paid];
}

const numberFormat = new Intl.NumberFormat("en-IN");

export function formatPrice(amount, currency) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${numberFormat.format(amount)}`;
  }
}

export function intervalSuffix(plan) {
  if (plan.interval === "MONTHLY") return "/month";
  if (plan.interval === "YEARLY") return "/year";
  if (plan.interval === "FREE") return "";
  return plan.rawInterval ? `/ ${humanize(plan.rawInterval).toLowerCase()}` : "";
}

const MAX_PREFIX = /^(max|maximum)\s+/;
const PERIOD_SUFFIX = /\s+per\s+(day|week|month|year)$/;

/** Limit entry -> readable line. -1 means unlimited. Returns "" if unusable. */
export function limitLabel(key, value) {
  if (value === null || value === undefined) return "";
  const words = humanize(key).toLowerCase();
  const isMax = MAX_PREFIX.test(words);
  const subject = words.replace(MAX_PREFIX, "");
  const n = typeof value === "string" && value.trim() === "" ? NaN : Number(value);

  if (!Number.isFinite(n)) {
    return typeof value === "string" ? `${humanize(key)}: ${value}` : "";
  }
  if (n === -1) {
    const s = subject.replace(PERIOD_SUFFIX, "");
    return `Unlimited ${s}`;
  }
  const num = numberFormat.format(n);
  const text = isMax ? `Up to ${num} ${subject}` : `${num} ${subject}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Readable rows for a plan: limits first, then features.
 * -> [{ key, label, included }]
 */
export function planRows(plan) {
  const rows = [];

  if (plan.limits) {
    for (const [key, value] of Object.entries(plan.limits)) {
      const label = limitLabel(key, value);
      if (label) rows.push({ key: `limit:${key}`, label, included: true });
    }
  }

  const f = plan.features;
  if (Array.isArray(f)) {
    f.filter((x) => typeof x === "string" && x.trim()).forEach((x) =>
      rows.push({ key: `feature:${x}`, label: humanize(x), included: true }),
    );
  } else if (isObject(f)) {
    for (const [key, value] of Object.entries(f)) {
      if (value === null || value === undefined) continue;
      if (typeof value === "boolean") {
        rows.push({ key: `feature:${key}`, label: humanize(key), included: value });
      } else if (typeof value === "number" || typeof value === "string") {
        const label =
          typeof value === "number" ? limitLabel(key, value) : `${humanize(key)}: ${value}`;
        if (label) rows.push({ key: `feature:${key}`, label, included: true });
      }
    }
  }
  return rows;
}

/** Keep register/login links as given; add ?type=organization for tenant plans. */
export function ctaHref(base, category) {
  if (category !== "tenant" || typeof base !== "string") return base;
  return /[?#]/.test(base) ? base : `${base}?type=organization`;
}