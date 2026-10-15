import axios from "axios";
import { getAccessToken } from "../../features/auth/state/sessionStore";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://yo.in/vidyaexam/api"
).replace(/\/$/, "");

const TAXONOMY_PATH = "/taxonomy";
const TIMEOUT_MS = 15000;

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

export class TaxonomyError extends Error {
  constructor(kind, message = "", status = null) {
    super(message || kind);
    this.name = "TaxonomyError";
    this.kind = kind; // "validation" | "conflict" | "notFound" | "auth" | "http" | "timeout" | "network"
    this.status = status;
  }
}

function handleAxiosError(error, defaultMessage = "Taxonomy request failed") {
  if (error?.response) {
    const status = error.response.status;
    const msg = error.response.data?.message || defaultMessage;
    if (status === 401 || status === 403) {
      throw new TaxonomyError("auth", "Session expired or unauthorized.", status);
    }
    if (status === 404) {
      throw new TaxonomyError("notFound", msg, status);
    }
    if (status === 409) {
      throw new TaxonomyError("conflict", msg || "Record already exists", status);
    }
    if (status === 400) {
      throw new TaxonomyError("validation", msg, status);
    }
    throw new TaxonomyError("http", msg, status);
  }
  if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT") {
    throw new TaxonomyError("timeout", "Request timed out. Please check your connection.");
  }
  if (error?.name === "CanceledError") {
    throw error;
  }
  throw new TaxonomyError("network", "Unable to connect to server. Please try again.");
}

// ========================================================================
// CATEGORIES
// ========================================================================

export async function getCategories({ signal } = {}) {
  try {
    const response = await axios.get(`${API_BASE_URL}${TAXONOMY_PATH}/getCategories`, {
      ...getAuthConfig(),
      timeout: TIMEOUT_MS,
      signal,
    });
    const payload = response?.data;
    return {
      success: true,
      count: payload?.count ?? payload?.data?.length ?? 0,
      data: Array.isArray(payload?.data) ? payload.data : [],
    };
  } catch (error) {
    handleAxiosError(error, "Failed to load categories");
  }
}

export async function createCategory({ category_name, category_code, description }) {
  if (!category_name?.trim()) {
    throw new TaxonomyError("validation", "Category name is required.");
  }
  if (!category_code?.trim()) {
    throw new TaxonomyError("validation", "Category code is required.");
  }

  try {
    const body = {
      category_name: category_name.trim(),
      category_code: category_code.trim().toUpperCase().replace(/\s+/g, "_"),
      description: description ? description.trim() : null,
    };
    const response = await axios.post(
      `${API_BASE_URL}${TAXONOMY_PATH}/createCategory`,
      body,
      { ...getAuthConfig(), timeout: TIMEOUT_MS }
    );
    return response.data;
  } catch (error) {
    handleAxiosError(error, "Failed to create category");
  }
}

// ========================================================================
// SUBJECTS
// ========================================================================

export async function getSubjects({ categoryId, signal } = {}) {
  try {
    const params = {};
    if (categoryId && categoryId !== "ALL") {
      params.categoryId = categoryId;
    }
    const response = await axios.get(`${API_BASE_URL}${TAXONOMY_PATH}/getSubjects`, {
      ...getAuthConfig(),
      params,
      timeout: TIMEOUT_MS,
      signal,
    });
    const payload = response?.data;
    return {
      success: true,
      count: payload?.count ?? payload?.data?.length ?? 0,
      data: Array.isArray(payload?.data) ? payload.data : [],
    };
  } catch (error) {
    handleAxiosError(error, "Failed to load subjects");
  }
}

export async function createSubject({ category_id, subject_name, subject_code }) {
  if (!category_id) {
    throw new TaxonomyError("validation", "Please select a category.");
  }
  if (!subject_name?.trim()) {
    throw new TaxonomyError("validation", "Subject name is required.");
  }

  try {
    const body = {
      category_id,
      subject_name: subject_name.trim(),
      subject_code: subject_code?.trim() ? subject_code.trim().toUpperCase() : null,
    };
    const response = await axios.post(
      `${API_BASE_URL}${TAXONOMY_PATH}/createSubject`,
      body,
      { ...getAuthConfig(), timeout: TIMEOUT_MS }
    );
    return response.data;
  } catch (error) {
    handleAxiosError(error, "Failed to create subject");
  }
}

// ========================================================================
// TOPICS
// ========================================================================

export async function getTopics({ subjectId, signal } = {}) {
  try {
    const params = {};
    if (subjectId && subjectId !== "ALL") {
      params.subjectId = subjectId;
    }
    const response = await axios.get(`${API_BASE_URL}${TAXONOMY_PATH}/getTopics`, {
      ...getAuthConfig(),
      params,
      timeout: TIMEOUT_MS,
      signal,
    });
    const payload = response?.data;
    return {
      success: true,
      count: payload?.count ?? payload?.data?.length ?? 0,
      data: Array.isArray(payload?.data) ? payload.data : [],
    };
  } catch (error) {
    handleAxiosError(error, "Failed to load topics");
  }
}

export async function createTopic({ subject_id, topic_name }) {
  if (!subject_id) {
    throw new TaxonomyError("validation", "Please select a subject.");
  }
  if (!topic_name?.trim()) {
    throw new TaxonomyError("validation", "Topic name is required.");
  }

  try {
    const body = {
      subject_id,
      topic_name: topic_name.trim(),
    };
    const response = await axios.post(
      `${API_BASE_URL}${TAXONOMY_PATH}/createTopic`,
      body,
      { ...getAuthConfig(), timeout: TIMEOUT_MS }
    );
    return response.data;
  } catch (error) {
    handleAxiosError(error, "Failed to create topic");
  }
}
