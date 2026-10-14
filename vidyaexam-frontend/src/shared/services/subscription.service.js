import axios from "axios";
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
  let json;
  try {
    const response = await axios.get(`${API_BASE}${PLANS_PATH}`, {
      timeout: TIMEOUT_MS,
      headers: { Accept: "application/json" },
    });
    json = response.data;
  } catch (error) {
    if (error?.response) throw new PlansError("http", error.response.status);
    if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT") {
      throw new PlansError("timeout");
    }
    throw new PlansError("network");
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
