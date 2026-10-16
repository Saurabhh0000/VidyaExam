
import axios from "axios";
import { getAccessToken, getSnapshot } from "../../auth/state/sessionStore";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://yo.in/vidyaexam/api"
).replace(/\/$/, "");

const BATCHES_PATH = `${API_BASE_URL}/batches`;
const REQUEST_TIMEOUT = 15000;

function getCurrentUser() {
  return getSnapshot()?.user;
}

function getCurrentRole() {
  return String(getCurrentUser()?.role || "").trim().toUpperCase();
}

function authConfig(extra = {}) {
  const token = getAccessToken();

  return {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    timeout: REQUEST_TIMEOUT,
    ...extra,
  };
}

function requireManagementRole() {
  const role = getCurrentRole();

  if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
    throw new Error("You do not have permission to manage batches.");
  }
}

function requireTenantContext() {
  requireManagementRole();

  const user = getCurrentUser();
  const role = getCurrentRole();

  // Super Admin may create batches only after choosing the
  // organization that should own the new batch.
  if (!user?.activeTenantId) {
    throw new Error(
      "Choose an active organization before managing batches."
    );
  }

  if (role === "ADMIN" && !user.activeTenantId) {
    throw new Error(
      "No active organization was found. Sign in to your organization again."
    );
  }
}

function requireBatchTenant(batchTenantId) {
  requireManagementRole();

  if (!batchTenantId) {
    throw new Error("The batch organization could not be identified.");
  }

  const role = getCurrentRole();
  const user = getCurrentUser();

  // Super Admin can manage batches belonging to any organization.
  if (role === "SUPER_ADMIN") {
    return;
  }

  // Admin can only manage batches owned by their active organization.
  if (!user?.activeTenantId) {
    throw new Error(
      "Choose your active organization before managing batches."
    );
  }

  if (String(batchTenantId) !== String(user.activeTenantId)) {
    throw new Error(
      "This batch does not belong to your active organization."
    );
  }
}

function requireReadScope() {
  const user = getCurrentUser();
  const role = getCurrentRole();

  if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
    throw new Error("You do not have permission to view batches.");
  }

  if (role === "ADMIN" && !user?.activeTenantId) {
    throw new Error(
      "No active organization was found. Sign in to your organization again."
    );
  }
}

function assertSuccess(payload, fallback) {
  if (payload?.success === false) {
    throw new Error(payload.message || fallback);
  }
}

export function getBatchErrorMessage(
  error,
  fallback = "The batch request could not be completed."
) {
  const message = error?.response?.data?.message;

  if (typeof message === "string" && message.trim()) {
    return message.trim();
  }

  if (
    !error?.response &&
    error?.message &&
    error?.isAxiosError !== true
  ) {
    return error.message;
  }

  if (
    error?.code === "ECONNABORTED" ||
    error?.code === "ETIMEDOUT"
  ) {
    return "The request timed out. Please try again.";
  }

  if (error?.response?.status === 401) {
    return "Your session has expired. Sign in and try again.";
  }

  if (error?.response?.status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (!error?.response) {
    return "Unable to connect. Check your connection and try again.";
  }

  return fallback;
}

export async function getBatches({ signal } = {}) {
  requireReadScope();

  const response = await axios.get(
    `${BATCHES_PATH}/getBatches`,
    authConfig({ signal })
  );

  const payload = response?.data;

  assertSuccess(payload, "Batches could not be loaded.");

  const body =
    payload?.data &&
    !Array.isArray(payload.data) &&
    Array.isArray(payload.data.data)
      ? payload.data
      : payload;

  if (!body || typeof body !== "object" || !Array.isArray(body.data)) {
    throw new Error(
      "The batches response was not in the expected format."
    );
  }

  const data = body.data;

  return {
    data,
    total: Number.isFinite(Number(body.total))
      ? Number(body.total)
      : data.length,
  };
}

export async function getBatchById(batchId, { signal } = {}) {
  requireReadScope();

  if (!batchId) {
    throw new Error("A batch ID is required.");
  }

  const response = await axios.get(
    `${BATCHES_PATH}/getBatchById/${encodeURIComponent(batchId)}`,
    authConfig({ signal })
  );

  const payload = response?.data;

  assertSuccess(payload, "Batch details could not be loaded.");

  const record =
    payload?.data?.data &&
    !Array.isArray(payload.data.data)
      ? payload.data.data
      : payload?.data;

  if (
    !record ||
    typeof record !== "object" ||
    Array.isArray(record)
  ) {
    throw new Error(
      "The batch details response was not in the expected format."
    );
  }

  const user = getCurrentUser();
  const role = getCurrentRole();

  if (
    role === "ADMIN" &&
    String(record.tenant_id || "") !==
      String(user?.activeTenantId || "")
  ) {
    throw new Error(
      "This batch does not belong to your active organization."
    );
  }

  return record;
}

function normalizeEditableFields(payload) {
  return {
    batch_name: String(payload?.batch_name ?? "").trim(),
    batch_code: String(payload?.batch_code ?? "").trim(),
    description: String(payload?.description ?? "").trim(),
  };
}

export async function createBatch(payload) {
  requireTenantContext();

  const fields = normalizeEditableFields(payload);

  if (!fields.batch_name || !fields.batch_code) {
    throw new Error("Batch name and batch code are required.");
  }

  const response = await axios.post(
    `${BATCHES_PATH}/createBatch`,
    fields,
    authConfig()
  );

  assertSuccess(response?.data, "Batch could not be created.");

  return response.data;
}

export async function updateBatch(
  batchId,
  payload,
  batchTenantId
) {
  requireBatchTenant(batchTenantId);

  if (!batchId) {
    throw new Error("A batch ID is required.");
  }

  const fields = normalizeEditableFields(payload);

  if (!fields.batch_name || !fields.batch_code) {
    throw new Error("Batch name and batch code are required.");
  }

  const response = await axios.put(
    `${BATCHES_PATH}/updateBatch/${encodeURIComponent(batchId)}`,
    fields,
    authConfig()
  );

  assertSuccess(response?.data, "Batch could not be updated.");

  return response.data;
}

export async function deleteBatch(batchId, batchTenantId) {
  requireBatchTenant(batchTenantId);

  if (!batchId) {
    throw new Error("A batch ID is required.");
  }

  const response = await axios.delete(
    `${BATCHES_PATH}/deleteBatch/${encodeURIComponent(batchId)}`,
    authConfig()
  );

  assertSuccess(response?.data, "Batch could not be deleted.");

  return response.data;
}
