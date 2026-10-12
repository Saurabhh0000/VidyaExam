import { normalizePlansResponse } from "../utils/plans";

/**
 * Subscription plans API client: GET {API base}/subscriptions/plans
 *
 * The base URL follows the same convention as auth.service.js
 * (VITE_API_BASE_URL). If the project has a shared API config, import it here
 * instead of repeating the fallback. Set VITE_PLANS_PATH only if the route differs.
 */
const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://yo.in/vidyaexam/api"
).replace(/\/$/, "");
const PLANS_PATH = import.meta.env.VITE_PLANS_PATH || "/subscriptions/plans";
const TIMEOUT_MS = 15000;

export class PlansError extends Error {
  constructor(kind, status = null) {
    super(kind);
    this.name = "PlansError";
    this.kind = kind; // "network" | "timeout" | "http" | "invalid"
    this.status = status;
  }
}

async function requestPlans() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${API_BASE}${PLANS_PATH}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  } catch (error) {
    throw new PlansError(error?.name === "AbortError" ? "timeout" : "network");
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) throw new PlansError("http", response.status);

  let json = null;
  try {
    json = await response.json();
  } catch {
    throw new PlansError("invalid", response.status);
  }

  try {
    return normalizePlansResponse(json);
  } catch {
    throw new PlansError("invalid", response.status);
  }
}

// One request per page load, shared by every caller (also across React
// StrictMode's double-mount). A failure clears the cache so Retry refetches.
let pending = null;

export function getPlans({ force = false } = {}) {
  if (force || !pending) {
    pending = requestPlans().catch((error) => {
      pending = null;
      throw error;
    });
  }
  return pending;
}