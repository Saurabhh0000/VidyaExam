import axios from "axios";
import { getAccessToken } from "../../auth/state/sessionStore";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://yo.in/vidyaexam/api"
).replace(/\/$/, "");
const NOTIFICATIONS_PATH = `${API_BASE_URL}/notifications`;

function config(extra = {}) {
  const token = getAccessToken();
  return {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    timeout: 15000,
    ...extra,
  };
}

function assertSuccess(payload, fallback) {
  if (payload?.success === false) throw new Error(payload.message || fallback);
}

export async function getMyNotifications({ signal } = {}) {
  const response = await axios.get(
    `${NOTIFICATIONS_PATH}/getMyNotifications`,
    config({ signal }),
  );
  const payload = response?.data;
  assertSuccess(payload, "Notifications could not be loaded.");
  const body =
    payload?.data && !Array.isArray(payload.data) && Array.isArray(payload.data.data)
      ? { ...payload.data, unread_count: payload.unread_count ?? payload.data.unread_count }
      : payload;
  return {
    data: Array.isArray(body?.data) ? body.data : [],
    total: Number(body?.total ?? 0),
    unreadCount: Number(body?.unread_count ?? 0),
  };
}

export async function markNotificationAsRead(notificationId) {
  if (!notificationId) throw new Error("A notification ID is required.");
  const response = await axios.patch(
    `${NOTIFICATIONS_PATH}/markAsRead/${encodeURIComponent(notificationId)}`,
    {},
    config(),
  );
  assertSuccess(response?.data, "Notification could not be marked as read.");
  return response.data?.data ?? response.data;
}

export async function markAllNotificationsAsRead() {
  const response = await axios.patch(
    `${NOTIFICATIONS_PATH}/markAllAsRead`,
    {},
    config(),
  );
  assertSuccess(response?.data, "Notifications could not be marked as read.");
  return response.data;
}

export async function deleteNotification(notificationId) {
  if (!notificationId) throw new Error("A notification ID is required.");
  const response = await axios.delete(
    `${NOTIFICATIONS_PATH}/deleteNotification/${encodeURIComponent(notificationId)}`,
    config(),
  );
  assertSuccess(response?.data, "Notification could not be dismissed.");
  return response.data;
}
