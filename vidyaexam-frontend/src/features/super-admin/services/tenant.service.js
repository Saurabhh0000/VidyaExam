import axios from "axios";
import { getAccessToken } from "../../auth/state/sessionStore";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://yo.in/vidyaexam/api"
).replace(/\/$/, "");

const TENANTS_PATH = "/super-admin/tenants";
const TIMEOUT_MS = 15000;

export class TenantsError extends Error {
  constructor(kind, message = "", status = null) {
    super(message || kind);
    this.name = "TenantsError";
    this.kind = kind; // "network" | "timeout" | "http" | "auth" | "invalid"
    this.status = status;
  }
}

function getAuthConfig() {
  const token = getAccessToken();

  return {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
}

export function normalizeTenant(raw) {
  if (!raw || typeof raw !== "object") return null;

  const tenantId = String(raw.tenant_id ?? "").trim();
  const tenantName = String(raw.tenant_name ?? "Untitled Organization").trim();
  const tenantCode = String(raw.tenant_code ?? "").trim().toUpperCase();
  const tenantType = String(raw.tenant_type ?? "COACHING_INSTITUTE").trim();
  const email = String(raw.email ?? "").trim();
  const mobileNo = String(raw.mobile_no ?? "").trim();
  const isActive = Boolean(raw.is_active);
  const createdAt = raw.created_at ? new Date(raw.created_at) : null;

  const subscriptionId = raw.subscription_id ? String(raw.subscription_id).trim() : null;
  const subscriptionStatus = String(raw.subscription_status ?? "INACTIVE").trim().toUpperCase();
  const subscriptionStartsAt = raw.subscription_starts_at ? new Date(raw.subscription_starts_at) : null;
  const subscriptionEndsAt = raw.subscription_ends_at ? new Date(raw.subscription_ends_at) : null;
  const planId = raw.plan_id ? String(raw.plan_id).trim() : null;
  const planName = String(raw.plan_name ?? "FREE").trim().toUpperCase();
  const billingInterval = String(raw.billing_interval ?? "FREE").trim().toUpperCase();

  const limits = {
    students: Number(raw.limits?.students ?? 0),
    teachers: Number(raw.limits?.teachers ?? 0),
  };

  const activeMembersCount = Number(raw.active_members_count ?? 0);

  return {
    tenantId,
    tenantName,
    tenantCode,
    tenantType,
    email,
    mobileNo,
    isActive,
    createdAt,
    subscriptionId,
    subscriptionStatus,
    subscriptionStartsAt,
    subscriptionEndsAt,
    planId,
    planName,
    billingInterval,
    limits,
    activeMembersCount,
    raw,
  };
}

export async function fetchTenants({ signal } = {}) {
  try {
    const response = await axios.get(`${API_BASE_URL}${TENANTS_PATH}`, {
      ...getAuthConfig(),
      timeout: TIMEOUT_MS,
      signal,
    });

    const payload = response?.data;

    if (!payload || typeof payload !== "object") {
      throw new TenantsError("invalid", "Invalid response from server");
    }

    if (payload.success === false) {
      throw new TenantsError("http", payload.message || "Failed to load tenants", response.status);
    }

    const rawList = Array.isArray(payload.data) ? payload.data : [];
    const tenants = rawList.map(normalizeTenant).filter(Boolean);

    return {
      success: true,
      message: payload.message || "Tenants retrieved successfully",
      count: typeof payload.count === "number" ? payload.count : tenants.length,
      data: tenants,
    };
  } catch (error) {
    if (error instanceof TenantsError) throw error;

    if (error?.response) {
      const status = error.response.status;
      const message = error.response.data?.message || "Server error while fetching tenants";
      if (status === 401 || status === 403) {
        throw new TenantsError("auth", "Session expired or unauthorized. Please sign in again.", status);
      }
      throw new TenantsError("http", message, status);
    }

    if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT") {
      throw new TenantsError("timeout", "Loading tenants took too long. Check your network connection.");
    }

    if (error?.name === "CanceledError") {
      throw error;
    }

    throw new TenantsError("network", "Unable to connect to the server. Check your network and try again.");
  }
}
