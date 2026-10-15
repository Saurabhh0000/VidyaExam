
import axios from "axios";
import {
  getAccessToken,
  getSnapshot,
} from "../../auth/state/sessionStore";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://yo.in/vidyaexam/api"
).replace(/\/$/, "");

function getTenantId() {
  const session = getSnapshot();
  return session?.user?.activeTenantId ?? null;
}

function requireTenantScope(tenantId, userId) {
  const activeTenantId = getTenantId();
  if (!activeTenantId) {
    throw new Error("No active organization was found. Please sign in again.");
  }
  if (!tenantId || String(tenantId) !== String(activeTenantId)) {
    throw new Error("The active organization changed. Refresh the page and try again.");
  }
  if (userId === undefined || userId === null || String(userId).trim() === "") {
    throw new Error("This user could not be identified. Refresh the directory and try again.");
  }
  return activeTenantId;
}

function getAuthConfig() {
  const token = getAccessToken();

  return {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
}

export async function createOrganizationMember({
  full_name,
  email,
  mobile_no,
  password,
  role_name,
}) {
  const tenantId = getTenantId();

  if (!tenantId) {
    throw new Error(
      "No active organization was found. Please sign in again."
    );
  }

  if (!["TEACHER", "STUDENT"].includes(role_name)) {
    throw new Error("Choose Teacher or Student before submitting.");
  }

  // Pick only the documented API fields so UI-only values never leak through.
  const body = {
    full_name: full_name.trim(),
    email: email.trim(),
    mobile_no: mobile_no.trim(),
    password,
    role_name,
  };

  const response = await axios.post(
    `${API_BASE_URL}/tenants/${encodeURIComponent(
      tenantId
    )}/createTenantUser`,
    body,
    getAuthConfig()
  );

  return response.data;
}

export async function getOrganizationUsers({ signal } = {}) {
  const tenantId = getTenantId();

  if (!tenantId) {
    throw new Error("No active organization was found. Please sign in again.");
  }

  const response = await axios.get(
    `${API_BASE_URL}/tenants/${encodeURIComponent(tenantId)}/getTenantUsers`,
    { ...getAuthConfig(), signal },
  );
  const payload = response?.data?.data && !Array.isArray(response.data.data)
    ? response.data.data
    : response?.data;

  if (!payload || typeof payload !== "object" || !Array.isArray(payload.data)) {
    throw new Error("The organization users response was not in the expected format.");
  }
  if (payload.success === false) {
    throw new Error(payload.message || "The organization users request was unsuccessful.");
  }

  return {
    success: true,
    quota: payload.quota && typeof payload.quota === "object" ? payload.quota : null,
    total_users: payload.total_users != null && Number.isFinite(Number(payload.total_users)) ? Number(payload.total_users) : null,
    data: payload.data,
  };
}

export async function updateTenantUser(tenantId, userId, payload) {
  const activeTenantId = requireTenantScope(tenantId, userId);
  const response = await axios.put(
    `${API_BASE_URL}/tenants/${encodeURIComponent(activeTenantId)}/updateTenantUser/${encodeURIComponent(userId)}`,
    payload,
    getAuthConfig(),
  );
  return response.data;
}

export async function deleteTenantUser(tenantId, userId) {
  const activeTenantId = requireTenantScope(tenantId, userId);
  const response = await axios.delete(
    `${API_BASE_URL}/tenants/${encodeURIComponent(activeTenantId)}/deleteTenantUser/${encodeURIComponent(userId)}`,
    getAuthConfig(),
  );
  return response.data;
}
