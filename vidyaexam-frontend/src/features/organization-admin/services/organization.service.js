
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

function getAuthConfig() {
  const token = getAccessToken();

  return {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
}

export async function createOrganizationTeacher(payload) {
  const tenantId = getTenantId();

  if (!tenantId) {
    throw new Error(
      "No active organization was found. Please sign in again."
    );
  }

  const response = await axios.post(
    `${API_BASE_URL}/tenants/${encodeURIComponent(
      tenantId
    )}/createTenantUser`,
    {
      ...payload,
      role_name: "TEACHER",
    },
    getAuthConfig()
  );

  return response.data;
}
