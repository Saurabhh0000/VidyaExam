import axios from "axios";
import { getAccessToken } from "../../auth/state/sessionStore";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://yo.in/vidyaexam/api"
).replace(/\/$/, "");

export async function getTenantDashboard({ signal } = {}) {
  const token = getAccessToken();
  const response = await axios.get(`${API_BASE_URL}/dashboard/tenant`, {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    timeout: 15000,
    signal,
  });

  const payload = response?.data;
  if (payload?.success === false) {
    throw new Error(payload.message || "Organization dashboard could not be loaded.");
  }
  return payload?.data && !Array.isArray(payload.data)
    ? payload.data
    : payload;
}
