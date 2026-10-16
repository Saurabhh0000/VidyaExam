import axios from "axios";
import { getAccessToken } from "../../auth/state/sessionStore";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://yo.in/vidyaexam/api"
).replace(/\/$/, "");
const QUESTIONS_PATH = `${API_BASE_URL}/questions`;

function authConfig(extra = {}) {
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

export function getApiErrorMessage(error, fallback = "The request could not be completed.") {
  const message = error?.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message.trim();
  if (!error?.response && error?.message && error?.isAxiosError !== true) return error.message;
  if (error?.code === "ECONNABORTED") return "The request timed out. Please try again.";
  if (error?.response?.status === 403) return "You do not have permission to perform this action.";
  if (error?.response?.status === 401) return "Your session has expired. Sign in and try again.";
  if (!error?.response) return "Unable to connect. Check your connection and try again.";
  return fallback;
}

function unwrapList(payload) {
  const body = payload?.data && !Array.isArray(payload.data) && Array.isArray(payload.data.data)
    ? payload.data
    : payload;
  if (body?.success === false) throw new Error(body.message || "The server rejected the request.");
  return {
    data: Array.isArray(body?.data) ? body.data : [],
    count: Number.isFinite(Number(body?.count)) ? Number(body.count) : (Array.isArray(body?.data) ? body.data.length : 0),
  };
}

export async function getQuestions(tenantId, { signal } = {}) {
  const response = await axios.get(`${QUESTIONS_PATH}/getQuestions`, authConfig({
    params: { tenant_id: tenantId == null ? "" : tenantId },
    signal,
  }));
  return unwrapList(response.data);
}

export async function getQuestionById(questionId, { signal } = {}) {
  const response = await axios.get(
    `${QUESTIONS_PATH}/getQuestionById/${encodeURIComponent(questionId)}`,
    authConfig({ signal }),
  );
  const payload = response?.data;
  if (payload?.success === false) throw new Error(payload.message || "Question could not be loaded.");
  const body = payload?.data && !Array.isArray(payload.data) ? payload.data : payload;
  if (body?.success === false) throw new Error(body.message || "Question could not be loaded.");
  return body?.data && !Array.isArray(body.data) ? body.data : body;
}

export async function createQuestion(payload) {
  const response = await axios.post(`${QUESTIONS_PATH}/createQuestion`, payload, authConfig());
  if (response?.data?.success === false) throw new Error(response.data.message || "Question could not be created.");
  return response.data;
}

export async function updateQuestion(questionId, payload) {
  const response = await axios.put(
    `${QUESTIONS_PATH}/updateQuestion/${encodeURIComponent(questionId)}`,
    payload,
    authConfig(),
  );
  if (response?.data?.success === false) throw new Error(response.data.message || "Question could not be updated.");
  return response.data;
}

export async function deleteQuestion(questionId) {
  const response = await axios.delete(
    `${QUESTIONS_PATH}/deleteQuestion/${encodeURIComponent(questionId)}`,
    authConfig(),
  );
  if (response?.data?.success === false) throw new Error(response.data.message || "Question could not be deleted.");
  return response.data;
}
