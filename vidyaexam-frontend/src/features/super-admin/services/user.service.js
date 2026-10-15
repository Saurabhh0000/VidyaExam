import axios from "axios";
import { getAccessToken } from "../../auth/state/sessionStore";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://yo.in/vidyaexam/api"
).replace(/\/$/, "");

const USERS_PATH = "/super-admin/users";
const TIMEOUT_MS = 15000;

export class UsersError extends Error {
  constructor(kind, message = "", status = null) {
    super(message || kind);
    this.name = "UsersError";
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

export function normalizeUser(raw) {
  if (!raw || typeof raw !== "object") return null;

  const userId = String(raw.user_id ?? "").trim();
  const fullName = String(raw.full_name ?? "Unnamed User").trim();
  const email = String(raw.email ?? "").trim();
  const mobileNo = raw.mobile_no ? String(raw.mobile_no).trim() : null;
  const isActive = Boolean(raw.is_active);
  const emailVerified = Boolean(raw.email_verified);
  const lastLoginAt = raw.last_login_at ? new Date(raw.last_login_at) : null;
  const createdAt = raw.created_at ? new Date(raw.created_at) : null;
  const defaultRole = raw.default_role
    ? String(raw.default_role).trim().toUpperCase()
    : "UNASSIGNED";

  return {
    userId,
    fullName,
    email,
    mobileNo,
    isActive,
    emailVerified,
    lastLoginAt,
    createdAt,
    defaultRole,
    raw,
  };
}

export async function fetchUsers({ page, limit, search, role, signal } = {}) {
  try {
    const params = {};
    if (page) params.page = page;
    if (limit) params.limit = limit;
    if (search) params.search = search;
    if (role && role !== "ALL") params.role = role;

    const response = await axios.get(`${API_BASE_URL}${USERS_PATH}`, {
      ...getAuthConfig(),
      params,
      timeout: TIMEOUT_MS,
      signal,
    });

    const payload = response?.data;

    if (!payload || typeof payload !== "object") {
      throw new UsersError("invalid", "Invalid response from users server");
    }

    if (payload.success === false) {
      throw new UsersError("http", payload.message || "Failed to load users", response.status);
    }

    const rawList = Array.isArray(payload.data) ? payload.data : [];
    const users = rawList.map(normalizeUser).filter(Boolean);

    const pagination = payload.pagination || {
      total: users.length,
      page: 1,
      limit: users.length || 20,
      totalPages: 1,
    };

    return {
      success: true,
      data: users,
      pagination: {
        total: Number(pagination.total ?? users.length),
        page: Number(pagination.page ?? 1),
        limit: Number(pagination.limit ?? 20),
        totalPages: Number(pagination.totalPages ?? 1),
      },
    };
  } catch (error) {
    if (error instanceof UsersError) throw error;

    if (error?.response) {
      const status = error.response.status;
      const message = error.response.data?.message || "Server error while fetching users";
      if (status === 401 || status === 403) {
        throw new UsersError("auth", "Session expired or unauthorized. Please sign in again.", status);
      }
      throw new UsersError("http", message, status);
    }

    if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT") {
      throw new UsersError("timeout", "Loading users took too long. Check your network connection.");
    }

    if (error?.name === "CanceledError") {
      throw error;
    }

    throw new UsersError("network", "Unable to connect to the users server. Check your network and try again.");
  }
}
