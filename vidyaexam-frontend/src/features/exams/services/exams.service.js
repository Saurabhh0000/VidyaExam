import axios from "axios";
import { getAccessToken } from "../../auth/state/sessionStore";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://yo.in/vidyaexam/api"
).replace(/\/$/, "");
const EXAMS_PATH = `${API_BASE_URL}/exams`;
const ATTEMPTS_PATH = `${API_BASE_URL}/attempts`;

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
  if (payload?.success === false) {
    throw new Error(payload.message || fallback);
  }
}

export function getExamErrorMessage(error, fallback = "The exam request could not be completed.") {
  const message = error?.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message.trim();
  if (!error?.response && error?.message && error?.isAxiosError !== true) return error.message;
  if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT") return "The request timed out. Please try again.";
  if (error?.response?.status === 401) return "Your session has expired. Sign in and try again.";
  if (error?.response?.status === 403) return "You do not have permission to perform this action.";
  if (!error?.response) return "Unable to connect. Check your connection and try again.";
  return fallback;
}

export async function getExams({ signal } = {}) {
  const response = await axios.get(`${EXAMS_PATH}/getExams`, config({ signal }));
  const payload = response?.data;
  assertSuccess(payload, "Exams could not be loaded.");
  const body = payload?.data && !Array.isArray(payload.data) && Array.isArray(payload.data.data)
    ? payload.data
    : payload;
  const data = Array.isArray(body?.data) ? body.data : [];
  return {
    data,
    total: Number.isFinite(Number(body?.total)) ? Number(body.total) : data.length,
  };
}

export async function getExamById(examId, { signal } = {}) {
  if (!examId) throw new Error("An exam ID is required.");
  const response = await axios.get(`${EXAMS_PATH}/getExamById/${encodeURIComponent(examId)}`, config({ signal }));
  const payload = response?.data;
  assertSuccess(payload, "Exam details could not be loaded.");
  return payload?.data && !Array.isArray(payload.data) ? payload.data : payload;
}

export async function createExam(payload) {
  const response = await axios.post(`${EXAMS_PATH}/createExam`, payload, config());
  assertSuccess(response?.data, "Exam could not be created.");
  return response.data;
}

export async function updateExam(examId, payload) {
  if (!examId) throw new Error("An exam ID is required.");
  const response = await axios.put(`${EXAMS_PATH}/updateExam/${encodeURIComponent(examId)}`, payload, config());
  assertSuccess(response?.data, "Exam could not be updated.");
  return response.data;
}

export async function deleteExam(examId) {
  if (!examId) throw new Error("An exam ID is required.");
  const response = await axios.delete(`${EXAMS_PATH}/deleteExam/${encodeURIComponent(examId)}`, config());
  assertSuccess(response?.data, "Exam could not be deleted.");
  return response.data;
}

export async function addExamSection(examId, payload) {
  if (!examId) throw new Error("An exam ID is required.");
  const response = await axios.post(`${EXAMS_PATH}/addSection/${encodeURIComponent(examId)}`, payload, config());
  assertSuccess(response?.data, "Section could not be added.");
  return response.data?.data ?? response.data;
}

export async function addExamQuestions(examId, payload) {
  if (!examId) throw new Error("An exam ID is required.");
  const response = await axios.post(`${EXAMS_PATH}/addQuestions/${encodeURIComponent(examId)}`, payload, config());
  assertSuccess(response?.data, "Questions could not be attached.");
  return response.data;
}

export async function removeExamQuestion(examId, questionId) {
  if (!examId || !questionId) throw new Error("Exam and question IDs are required.");
  const response = await axios.delete(`${EXAMS_PATH}/removeQuestion/${encodeURIComponent(examId)}/${encodeURIComponent(questionId)}`, config());
  assertSuccess(response?.data, "Question could not be removed from the exam.");
  return response.data;
}

export async function assignExamBatches(examId, batchIds) {
  if (!examId) throw new Error("An exam ID is required.");
  const response = await axios.patch(`${EXAMS_PATH}/assignBatches/${encodeURIComponent(examId)}`, { batch_ids: batchIds }, config());
  assertSuccess(response?.data, "Exam batches could not be updated.");
  return response.data;
}

export async function publishExam(examId) {
  if (!examId) throw new Error("An exam ID is required.");
  const response = await axios.patch(`${EXAMS_PATH}/publishExam/${encodeURIComponent(examId)}`, {}, config());
  assertSuccess(response?.data, "Exam could not be published.");
  return response.data;
}

export async function getMyExams({ signal } = {}) {
  const response = await axios.get(`${EXAMS_PATH}/getMyExams`, config({ signal }));
  const payload = response?.data;
  assertSuccess(payload, "Your exams could not be loaded.");
  const nested = payload?.data && !Array.isArray(payload.data) && Array.isArray(payload.data.data) ? payload.data : payload;
  const data = Array.isArray(nested?.data) ? nested.data : [];
  return {
    data,
    total: Number(nested?.total) || data.length,
    studentBatchesCount: Number.isFinite(Number(nested?.student_batches_count))
      ? Number(nested.student_batches_count)
      : null,
  };
}

export async function startExam(examId) {
  if (!examId) throw new Error("An exam ID is required.");
  const response = await axios.post(`${ATTEMPTS_PATH}/startExam/${encodeURIComponent(examId)}`, {}, config());
  assertSuccess(response?.data, "The exam could not be started.");
  return response.data;
}

export async function saveExamResponse(attemptId, payload) {
  if (!attemptId) throw new Error("An attempt ID is required.");
  const response = await axios.post(`${ATTEMPTS_PATH}/saveResponse/${encodeURIComponent(attemptId)}`, payload, config());
  assertSuccess(response?.data, "Your answer could not be saved.");
  return response.data;
}

export async function submitExamAttempt(attemptId, timeSpentSeconds) {
  if (!attemptId) throw new Error("An attempt ID is required.");
  const response = await axios.post(`${ATTEMPTS_PATH}/submitExam/${encodeURIComponent(attemptId)}`, { time_spent_seconds: timeSpentSeconds }, config());
  assertSuccess(response?.data, "The exam could not be submitted.");
  return response.data?.data ?? response.data;
}

export async function getExamResult(attemptId, { signal } = {}) {
  if (!attemptId) throw new Error("An attempt ID is required.");
  const response = await axios.get(`${ATTEMPTS_PATH}/getResult/${encodeURIComponent(attemptId)}`, config({ signal }));
  assertSuccess(response?.data, "Exam results could not be loaded.");
  return response.data?.data ?? response.data;
}

export async function getMyExamHistory({ signal } = {}) {
  const response = await axios.get(`${ATTEMPTS_PATH}/getMyHistory`, config({ signal }));
  const payload = response?.data;
  assertSuccess(payload, "Your exam history could not be loaded.");
  if (Array.isArray(payload?.data)) return payload.data;
  return Array.isArray(payload?.data?.data) ? payload.data.data : [];
}
