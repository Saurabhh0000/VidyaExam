import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DataTable from "react-data-table-component";
import styled from "styled-components";
import { jsPDF } from "jspdf";
import {
  Boxes,
  Building2,
  CalendarDays,
  CircleAlert,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  LayoutGrid,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Table2,
  Trash2,
  Users,
  X,
} from "lucide-react";

import Modal from "../../../shared/components/ui/Modal";
import BrandLoader from "../../../shared/components/ui/BrandLoader";
import { MasterWorkspaceStats, MasterWorkspaceTabs } from "../../../shared/components/MasterWorkspaceSection";
import { TenantPagination, TenantSelect } from "../../super-admin/components/TenantControls";
import useAuthState from "../../auth/utils/useAuthState";
import toast from "../../../shared/components/ui/toast";
import { formatDate } from "../../super-admin/utils/tenantFormatters";

import {
  createBatch,
  deleteBatch,
  getBatchById,
  getBatchErrorMessage,
  getBatches,
  updateBatch,
} from "../services/batches.service";

import "../styles/batches.css";

const StyledTable = styled(DataTable)`
  .rdt_Table {
    background: transparent;
    min-width: 760px;
  }

  .rdt_TableHeadRow {
    min-height: 50px;
    background: #f3f8f7;
    border-bottom: 1px solid #dce8e6;
  }

  .rdt_TableCol {
    justify-content: flex-start;
    color: #53657b;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .rdt_TableRow {
    min-height: 68px;
    color: #263b59;
    border-bottom: 1px solid #edf2f1;
  }

  .rdt_TableRow:hover {
    background: #f8fbfa;
  }

  .rdt_TableCell {
    justify-content: flex-start;
    padding: 11px 12px;
    font-size: 0.8rem;
    text-align: left;
  }

  .rdt_Pagination {
    min-height: 58px;
    color: #64748b;
    border-top: 1px solid #edf2f1;
    font-size: 0.78rem;
  }

  @media (max-width: 640px) {
    .rdt_TableCell {
      padding: 9px 8px;
      font-size: 0.73rem;
    }

    .rdt_TableCol {
      padding: 0 8px;
      font-size: 0.65rem;
    }
  }
`;

const EMPTY_FORM = {
  batch_name: "",
  batch_code: "",
  description: "",
};

function getRole(user) {
  return String(user?.role || "")
    .trim()
    .toUpperCase();
}

function getTenantId(batch) {
  return batch?.tenant_id ?? batch?.tenantId ?? null;
}

function getBatchId(batch) {
  return batch?.batch_id ?? batch?.batchId ?? batch?.id ?? null;
}

function isActiveBatch(batch) {
  const value = batch?.is_active ?? batch?.isActive;

  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    String(value).toLowerCase() === "true"
  );
}

function csvValue(value) {
  const text = value == null ? "" : String(value);

  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadCsv(records) {
  const columns = [
    "Batch / Class",
    "Batch Code",
    "Description",
    "Organization",
    "Students",
    "Status",
    "Created At",
  ];

  const rows = records.map((batch) => [
    batch.batch_name,
    batch.batch_code,
    batch.description,
    batch.tenant_name,
    Number(batch.total_students) || 0,
    isActiveBatch(batch) ? "Active" : "Inactive",
    batch.created_at,
  ]);

  const contents = [columns, ...rows]
    .map((row) => row.map(csvValue).join(","))
    .join("\r\n");

  const url = URL.createObjectURL(
    new Blob([`\uFEFF${contents}`], {
      type: "text/csv;charset=utf-8",
    }),
  );

  const link = document.createElement("a");
  link.href = url;
  link.download = `vidyaexam-batches-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function loadBrandLogo() {
  const response = await fetch(`${import.meta.env.BASE_URL}logo.png`);

  if (!response.ok) {
    throw new Error("Unable to load the VidyaExam logo.");
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () =>
      reject(new Error("Unable to prepare the VidyaExam logo."));

    reader.readAsDataURL(blob);
  });
}

async function downloadPdf(records) {
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 38;

  const navy = [23, 43, 77];
  const teal = [15, 118, 110];
  const muted = [91, 109, 133];

  const columns = [
    { label: "BATCH / CLASS", x: 38, width: 102 },
    { label: "CODE", x: 148, width: 68 },
    { label: "DESCRIPTION", x: 223, width: 162 },
    { label: "ORGANIZATION", x: 393, width: 122 },
    { label: "STUDENTS", x: 523, width: 58 },
    { label: "STATUS", x: 588, width: 62 },
    { label: "CREATED", x: 658, width: 108 },
  ];

  let logo = null;

  try {
    logo = await loadBrandLogo();
  } catch {
    // Keep the VidyaExam text header if the logo is unavailable.
  }

  function drawHeader(pageNumber) {
    pdf.setFillColor(...navy);
    pdf.rect(0, 0, pageWidth, 104, "F");

    pdf.setFillColor(...teal);
    pdf.rect(0, 101, pageWidth, 3, "F");

    if (logo) {
      pdf.addImage(logo, "PNG", margin, 28, 145, 48, undefined, "FAST");
    } else {
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(21);
      pdf.text("VidyaExam", margin, 53);
    }

    pdf.setTextColor(107, 231, 209);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text("MASTER DATA  /  BATCHES & CLASSES", 225, 38);

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(23);
    pdf.text("Batch Directory", 225, 65);

    pdf.setTextColor(225, 234, 244);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(
      `${records.length} ${
        records.length === 1 ? "record" : "records"
      }  ·  Generated ${new Date().toLocaleString()}`,
      225,
      84,
    );

    pdf.setTextColor(...muted);
    pdf.setFontSize(8);
    pdf.text(`Page ${pageNumber}`, pageWidth - margin, 88, {
      align: "right",
    });
  }

  function drawTableHead(y) {
    pdf.setFillColor(241, 247, 246);
    pdf.roundedRect(margin, y, pageWidth - margin * 2, 28, 5, 5, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...muted);

    columns.forEach((column) => {
      pdf.text(column.label, column.x, y + 18);
    });

    return y + 36;
  }

  drawHeader(1);

  let y = drawTableHead(132);
  const rowHeight = 34;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);

  records.forEach((batch, index) => {
    if (y + rowHeight > pageHeight - 42) {
      pdf.addPage();
      drawHeader(pdf.internal.getNumberOfPages());
      y = drawTableHead(132);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
    }

    if (index % 2 === 1) {
      pdf.setFillColor(249, 251, 251);
      pdf.rect(margin, y - 9, pageWidth - margin * 2, rowHeight, "F");
    }

    pdf.setDrawColor(228, 236, 235);
    pdf.line(margin, y + 19, pageWidth - margin, y + 19);
    pdf.setTextColor(...navy);

    const values = [
      batch.batch_name || "—",
      batch.batch_code || "—",
      batch.description || "—",
      batch.tenant_name || "—",
      String(Number(batch.total_students) || 0),
      isActiveBatch(batch) ? "Active" : "Inactive",
      batch.created_at ? formatDate(batch.created_at) : "—",
    ];

    values.forEach((value, valueIndex) => {
      const column = columns[valueIndex];
      const wrapped = pdf.splitTextToSize(String(value), column.width);

      pdf.text(wrapped.slice(0, 2), column.x, y + 2);
    });

    y += rowHeight;
  });

  pdf.setTextColor(...muted);
  pdf.setFontSize(8);
  pdf.text("Empowering learning, achieving dreams.", margin, pageHeight - 22);

  pdf.save(`vidyaexam-batches-${new Date().toISOString().slice(0, 10)}.pdf`);
}

function BatchForm({ mode, batch, submitting, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => ({
    batch_name: batch?.batch_name || "",
    batch_code: batch?.batch_code || "",
    description: batch?.description || "",
  }));

  const [errors, setErrors] = useState({});

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
    }));
  }

  function submit(event) {
    event.preventDefault();

    const nextErrors = {};

    if (!form.batch_name.trim()) {
      nextErrors.batch_name = "Enter a batch or class name.";
    }

    if (!form.batch_code.trim()) {
      nextErrors.batch_code = "Enter a batch code.";
    }

    if (form.batch_name.trim().length > 100) {
      nextErrors.batch_name = "Batch name cannot exceed 100 characters.";
    }

    if (form.batch_code.trim().length > 50) {
      nextErrors.batch_code = "Batch code cannot exceed 50 characters.";
    }

    if (form.description.trim().length > 1000) {
      nextErrors.description = "Description cannot exceed 1000 characters.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.warning("Please review the form", {
        description: "Correct the highlighted fields before continuing.",
      });
      return;
    }

    onSubmit({
      batch_name: form.batch_name.trim(),
      batch_code: form.batch_code.trim(),
      description: form.description.trim(),
    });
  }

  return (
    <form className="ve-batch-form" onSubmit={submit} noValidate>
      <label className="ve-batch-field">
        <span>
          Batch / Class Name <b>*</b>
        </span>

        <input
          name="batch_name"
          value={form.batch_name}
          onChange={updateField}
          placeholder="e.g. Class 1"
          maxLength={100}
          aria-invalid={Boolean(errors.batch_name)}
          aria-describedby={errors.batch_name ? "batch-name-error" : undefined}
          autoComplete="off"
          autoFocus
        />

        {errors.batch_name && (
          <small id="batch-name-error" className="ve-batch-error">
            {errors.batch_name}
          </small>
        )}
      </label>

      <label className="ve-batch-field">
        <span>
          Batch Code <b>*</b>
        </span>

        <input
          name="batch_code"
          value={form.batch_code}
          onChange={updateField}
          placeholder="e.g. CLS-01"
          maxLength={50}
          aria-invalid={Boolean(errors.batch_code)}
          aria-describedby={errors.batch_code ? "batch-code-error" : undefined}
          autoComplete="off"
        />

        {errors.batch_code && (
          <small id="batch-code-error" className="ve-batch-error">
            {errors.batch_code}
          </small>
        )}
      </label>

      <label className="ve-batch-field">
        <span>
          Description <small>Optional</small>
        </span>

        <textarea
          name="description"
          value={form.description}
          onChange={updateField}
          placeholder="Add a short description for this batch"
          maxLength={1000}
          rows={4}
        />

        {errors.description && (
          <small className="ve-batch-error">{errors.description}</small>
        )}
      </label>

      <div className="ve-batch-modal-actions">
        <button
          type="button"
          className="ve-batch-button ve-batch-button--secondary"
          onClick={onCancel}
          disabled={submitting}>
          Cancel
        </button>

        <button
          type="submit"
          className="ve-batch-button ve-batch-button--primary"
          disabled={submitting}
          aria-busy={submitting}>
          {submitting
            ? <><RefreshCw size={15} className="ve-batch-inline-spinner" aria-hidden="true" />{mode === "edit" ? "Saving…" : "Creating…"}</>
            : mode === "edit"
              ? "Save changes"
              : "Create batch"}
        </button>
      </div>
    </form>
  );
}

function StatusBadge({ active }) {
  return (
    <span className={`ve-batch-status ${active ? "is-active" : "is-inactive"}`}>
      <i aria-hidden="true" />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default function BatchesPage() {
  const { user } = useAuthState();

  const role = getRole(user);
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAdmin = role === "ADMIN";
  const hasManagementRole = isSuperAdmin || isAdmin;

  const activeTenantId = user?.activeTenantId ?? user?.active_tenant_id ?? null;

  // Both roles may create batches, but the create API requires
  // an active organization to determine the new batch's tenant.
  const canCreate = hasManagementRole && Boolean(activeTenantId);

  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("table");
  const [gridPage, setGridPage] = useState(1);
  const [gridRowsPerPage, setGridRowsPerPage] = useState(10);
  const [refreshToggle, setRefreshToggle] = useState(false);
  const [resetPagination, setResetPagination] = useState(false);

  const [formTarget, setFormTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const submitLock = useRef(false);
  const deleteLock = useRef(false);
  const previousTenantId = useRef(activeTenantId || "");

  const canManageRecord = useCallback(
    (batch) => {
      if (!hasManagementRole) return false;

      const tenantId = getTenantId(batch);

      if (tenantId === null || tenantId === undefined || tenantId === "") {
        return false;
      }

      // Super Admin can manage batches across organizations.
      if (isSuperAdmin) return true;

      // Organization Admin can manage batches only in their active tenant.
      return (
        Boolean(activeTenantId) && String(tenantId) === String(activeTenantId)
      );
    },
    [hasManagementRole, isSuperAdmin, activeTenantId],
  );

  const loadBatches = useCallback(
    async (signal) => {
      if (!hasManagementRole) {
        setRecords([]);
        setTotal(0);
        setError("You do not have permission to access batch management.");
        setStatus("error");
        return;
      }

      setStatus("loading");
      setError("");

      try {
        const result = await getBatches({ signal });

        if (signal?.aborted) return;

        const allRecords = Array.isArray(result?.data) ? result.data : [];

        // Super Admin sees all returned organizations.
        // Organization Admin sees only their active tenant.
        const scopedRecords = isSuperAdmin
          ? allRecords
          : allRecords.filter(
              (batch) =>
                String(getTenantId(batch) ?? "") ===
                String(activeTenantId ?? ""),
            );

        setRecords(scopedRecords);

        setTotal(
          isSuperAdmin
            ? Number(result?.total ?? allRecords.length)
            : scopedRecords.length,
        );

        setStatus("ready");
      } catch (requestError) {
        if (
          requestError?.name === "CanceledError" ||
          requestError?.code === "ERR_CANCELED" ||
          signal?.aborted
        ) {
          return;
        }

        const message = getBatchErrorMessage(
          requestError,
          "Unable to load batches.",
        );

        setError(message);
        setStatus("error");

        toast.error("Could not load batches", {
          description: message,
        });
      }
    },
    [hasManagementRole, isSuperAdmin, activeTenantId],
  );

  useEffect(() => {
    if (previousTenantId.current !== (activeTenantId || "")) {
      setRecords([]);
      setTotal(0);
      previousTenantId.current = activeTenantId || "";
    }

    const controller = new AbortController();

    loadBatches(controller.signal);

    return () => controller.abort();
  }, [loadBatches, refreshToggle, activeTenantId]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return records.filter((batch) => {
      const matchesQuery =
        !query ||
        [
          batch.batch_name,
          batch.batch_code,
          batch.description,
          batch.tenant_name,
        ].some((value) =>
          String(value || "")
            .toLocaleLowerCase()
            .includes(query),
        );

      const active = isActiveBatch(batch);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && active) ||
        (statusFilter === "INACTIVE" && !active);

      return matchesQuery && matchesStatus;
    });
  }, [records, search, statusFilter]);

  useEffect(() => {
    setResetPagination((current) => !current);
    setGridPage(1);
  }, [search, statusFilter]);

  const gridPageCount = Math.max(1, Math.ceil(filteredRecords.length / gridRowsPerPage));
  const gridPageRecords = filteredRecords.slice((gridPage - 1) * gridRowsPerPage, gridPage * gridRowsPerPage);

  const columns = useMemo(
    () => [
      {
        name: "Batch / Class",
        selector: (batch) => batch.batch_name || "",
        sortable: true,
        grow: 1.35,
        cell: (batch) => (
          <div className="ve-batch-name-cell">
            <span className="ve-batch-row-icon">
              <Boxes size={17} aria-hidden="true" />
            </span>

            <div>
              <strong>{batch.batch_name || "Untitled batch"}</strong>
              <small>{batch.batch_code || "No code"}</small>
            </div>
          </div>
        ),
      },
      {
        name: "Description",
        selector: (batch) => batch.description || "",
        sortable: true,
        grow: 1.5,
        cell: (batch) => (
          <span
            className="ve-batch-description"
            title={batch.description || ""}>
            {batch.description || "—"}
          </span>
        ),
      },
      ...(isSuperAdmin
        ? [
            {
              name: "Organization",
              selector: (batch) => batch.tenant_name || "",
              sortable: true,
              grow: 1.1,
              cell: (batch) => (
                <span className="ve-batch-tenant">
                  <Building2 size={14} aria-hidden="true" />
                  {batch.tenant_name || "—"}
                </span>
              ),
            },
          ]
        : []),
      {
        name: "Students",
        selector: (batch) => Number(batch.total_students) || 0,
        sortable: true,
        width: "132px",
        cell: (batch) => (
          <span className="ve-batch-student-count">
            <Users size={14} aria-hidden="true" />
            {Number(batch.total_students) || 0}
          </span>
        ),
      },
      {
        name: "Status",
        selector: (batch) => isActiveBatch(batch),
        sortable: true,
        width: "125px",
        cell: (batch) => <StatusBadge active={isActiveBatch(batch)} />,
      },
      {
        name: "Created",
        selector: (batch) => batch.created_at || "",
        sortable: true,
        width: "130px",
        cell: (batch) => (
          <span className="ve-batch-date">
            <CalendarDays size={14} aria-hidden="true" />
            {formatDate(batch.created_at)}
          </span>
        ),
      },
      {
        name: "Actions",
        button: true,
        width: isSuperAdmin ? "126px" : "126px",
        cell: (batch) => (
          <div className="ve-batch-actions">
            <button
              type="button"
              aria-label={`View ${batch.batch_name || "batch"}`}
              title="View batch"
              onClick={() => openDetail(batch)}>
              <Eye size={15} />
            </button>

            {canManageRecord(batch) && (
              <>
                <button
                  type="button"
                  aria-label={`Edit ${batch.batch_name || "batch"}`}
                  title="Edit batch"
                  onClick={() => setFormTarget({ mode: "edit", batch })}>
                  <Pencil size={15} />
                </button>

                <button
                  type="button"
                  className="is-danger"
                  aria-label={`Delete ${batch.batch_name || "batch"}`}
                  title="Delete batch"
                  onClick={() => setDeleteTarget(batch)}>
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </div>
        ),
      },
    ],
    [isSuperAdmin, canManageRecord],
  );

  async function openDetail(batch) {
    setDetail({ status: "loading", batch });

    try {
      const latest = await getBatchById(getBatchId(batch));

      // Enforce organization scope in the UI as well as in the service.
      if (
        isAdmin &&
        String(getTenantId(latest) ?? "") !== String(activeTenantId ?? "")
      ) {
        throw new Error(
          "This batch does not belong to your active organization.",
        );
      }

      setDetail({ status: "ready", batch: latest });
    } catch (requestError) {
      const message = getBatchErrorMessage(
        requestError,
        "Unable to load batch details.",
      );

      setDetail({
        status: "error",
        batch,
        error: message,
      });
    }
  }

  async function submitForm(payload) {
    if (submitLock.current) return;

    if (!hasManagementRole) {
      toast.error("You do not have permission to manage batches.");
      return;
    }

    if (formTarget?.mode === "create" && !canCreate) {
      toast.error("Choose an active organization before creating a batch.");
      return;
    }

    if (formTarget?.mode === "edit" && !canManageRecord(formTarget.batch)) {
      toast.error("You do not have permission to edit this batch.");
      return;
    }

    submitLock.current = true;
    setSubmitting(true);

    try {
      if (formTarget.mode === "edit") {
        await updateBatch(
          getBatchId(formTarget.batch),
          payload,
          getTenantId(formTarget.batch),
        );

        toast.success("Batch updated successfully.");
      } else {
        await createBatch(payload);

        toast.success("Batch created successfully.");
      }

      setFormTarget(null);
      setRefreshToggle((current) => !current);
    } catch (requestError) {
      toast.error(
        formTarget?.mode === "edit"
          ? "Unable to update batch."
          : "Unable to create batch.",
        {
          description: getBatchErrorMessage(requestError),
        },
      );
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleteLock.current) return;

    if (!canManageRecord(deleteTarget)) {
      toast.error("You do not have permission to delete this batch.");
      return;
    }

    deleteLock.current = true;
    setDeleting(true);

    try {
      await deleteBatch(getBatchId(deleteTarget), getTenantId(deleteTarget));

      toast.success("Batch deleted successfully.", {
        description: `${deleteTarget.batch_name} was removed.`,
      });

      setDeleteTarget(null);
      setRefreshToggle((current) => !current);
    } catch (requestError) {
      toast.error("Unable to delete batch.", {
        description: getBatchErrorMessage(requestError),
      });
    } finally {
      deleteLock.current = false;
      setDeleting(false);
    }
  }

  function exportCsv() {
    if (!filteredRecords.length) {
      toast.warning("No batches to export", {
        description: "Adjust your search or filters and try again.",
      });
      return;
    }

    downloadCsv(filteredRecords);

    toast.success("CSV exported successfully.", {
      description: `${filteredRecords.length} matching ${
        filteredRecords.length === 1 ? "batch" : "batches"
      } included.`,
    });
  }

  async function exportPdf() {
    if (!filteredRecords.length) {
      toast.warning("No batches to export", {
        description: "Adjust your search or filters and try again.",
      });
      return;
    }

    try {
      await downloadPdf(filteredRecords);

      toast.success("PDF exported successfully.", {
        description: `${filteredRecords.length} matching ${
          filteredRecords.length === 1 ? "batch" : "batches"
        } included.`,
      });
    } catch (exportError) {
      toast.error("Unable to export PDF.", {
        description: exportError?.message || "Please try again.",
      });
    }
  }

  const noData =
    status === "error" ? (
      <div className="ve-batch-empty ve-batch-empty--error" role="alert">
        <CircleAlert size={24} />
        <strong>Couldn’t load batches</strong>
        <span>{error}</span>

        <button
          type="button"
          className="ve-batch-button ve-batch-button--secondary"
          onClick={() => setRefreshToggle((current) => !current)}>
          Try again
        </button>
      </div>
    ) : filteredRecords.length === 0 ? (
      <div className="ve-batch-empty">
        <span className="ve-batch-empty-icon">
          {search || statusFilter !== "ALL" ? (
            <Search size={23} />
          ) : (
            <Boxes size={23} />
          )}
        </span>

        <strong>
          {search || statusFilter !== "ALL"
            ? "No batches match your filters"
            : "No batches found"}
        </strong>

        <span>
          {search || statusFilter !== "ALL"
            ? "Try a different search or clear the selected filters."
            : "Create your first batch to get started."}
        </span>

        {canCreate && !search && statusFilter === "ALL" && (
          <button
            type="button"
            className="ve-batch-button ve-batch-button--primary"
            onClick={() => setFormTarget({ mode: "create" })}>
            <Plus size={16} />
            Create batch
          </button>
        )}
      </div>
    ) : null;

  if (!hasManagementRole) {
    return (
      <main className="ve-batches-page">
        <div className="ve-batch-context-note" role="alert">
          <ShieldCheck size={17} aria-hidden="true" />
          <span>You do not have permission to access batch management.</span>
        </div>
      </main>
    );
  }

  return (
    <main className="ve-batches-page sa-taxonomy-section sa-master-section">
      <header className="ve-batches-heading">
        <div>
          <span className="ve-batches-eyebrow">
            <Boxes size={15} aria-hidden="true" />
            MASTER DATA
          </span>

          <h1>Batches / Classes</h1>

          <p>
            {isSuperAdmin
              ? "Review and manage batches across VidyaExam organizations."
              : "Create and manage batches for your organization."}
          </p>
        </div>

        <div className="ve-batch-heading-actions">
          <button
            type="button"
            className="ve-batch-button ve-batch-button--secondary"
            onClick={exportCsv}
            disabled={!filteredRecords.length}>
            <FileSpreadsheet size={16} aria-hidden="true" />
            Export CSV
          </button>

          <button
            type="button"
            className="ve-batch-button ve-batch-button--secondary"
            onClick={exportPdf}
            disabled={!filteredRecords.length}>
            <FileText size={16} aria-hidden="true" />
            Export PDF
          </button>

        </div>
      </header>

      <MasterWorkspaceStats page="batches" batchCount={total} />

      {!activeTenantId && (
        <div className="ve-batch-context-note" role="status">
          <ShieldCheck size={17} aria-hidden="true" />
          <span>
            {isSuperAdmin
              ? "Select an organization before creating a batch. You can still review batches across organizations."
              : "Select your active organization before creating or managing batches."}
          </span>
        </div>
      )}

      <section className="ve-batch-panel sa-content-panel sa-taxonomy-panel" aria-label="Batch directory">
        <MasterWorkspaceTabs page="batches" batchCount={total} action={canCreate ? <button type="button" className="ve-batch-button ve-batch-button--primary" onClick={() => setFormTarget({ mode: "create" })}><Plus size={17} aria-hidden="true" />Create Batch</button> : null} />
        <div className="ve-batch-toolbar sa-tenants-toolbar">
          <div className="ve-batch-toolbar-left sa-toolbar-left">
          <label className="ve-batch-search">
            <Search size={17} aria-hidden="true" />

            <span className="ve-batch-sr-only">
              Search batches by name or code
            </span>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by batch name or code…"
            />

            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch("")}>
                <X size={16} />
              </button>
            )}
          </label>

          <div className="ve-batch-filter sa-filter-group">
            <Filter size={15} aria-hidden="true" />
            <TenantSelect
              value={statusFilter}
              options={[
                { value: "ALL", label: "All statuses" },
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
              ]}
              onChange={setStatusFilter}
              label="Filter batches by status"
              className="ve-batch-status-filter"
              compact
            />
          </div>
          </div>

          <div className="ve-batch-toolbar-right sa-toolbar-right">
          <div className="ve-batch-view-toggle sa-view-toggle" role="group" aria-label="Batch view mode">
            <button type="button" className={`sa-view-btn${viewMode === "table" ? " is-active" : ""}`} onClick={() => setViewMode("table")} aria-label="List view" title="List view" aria-pressed={viewMode === "table"}>
              <Table2 size={17} aria-hidden="true" />
            </button>
            <button type="button" className={`sa-view-btn${viewMode === "grid" ? " is-active" : ""}`} onClick={() => setViewMode("grid")} aria-label="Grid view" title="Grid view" aria-pressed={viewMode === "grid"}>
              <LayoutGrid size={17} aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            className="ve-batch-refresh sa-icon-btn"
            onClick={() => setRefreshToggle((current) => !current)}
            disabled={status === "loading"}
            aria-label="Refresh batches"
            title="Refresh batches">
            <RefreshCw
              size={17}
              className={status === "loading" ? "is-spinning" : ""}
            />
          </button>
          </div>
        </div>

        {isSuperAdmin && (
          <p className="ve-batch-scope">
            <Building2 size={14} aria-hidden="true" />
            All organizations are included. You can manage batches belonging to
            any organization.
          </p>
        )}

        {isAdmin && (
          <p className="ve-batch-scope">
            <ShieldCheck size={14} aria-hidden="true" />
            Only batches belonging to your active organization are shown.
          </p>
        )}

        {status === "error" && records.length > 0 && (
          <div className="ve-batch-inline-error" role="alert">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setRefreshToggle((current) => !current)}>
              Retry
            </button>
          </div>
        )}

        {status === "loading" && records.length === 0 ? (
          <BrandLoader variant="section" message="Loading batches…" />
        ) : (
          <>
        {status === "loading" && (
          <BrandLoader
            variant="section"
            className="ve-brand-loader--compact"
            message="Refreshing batches…"
          />
        )}
        {viewMode === "table" ? <div className="ve-batch-table-wrap">
          <StyledTable
            keyField="batch_id"
            columns={columns}
            data={filteredRecords}
            noDataComponent={noData}
            pagination
            paginationDefaultPage={1}
            paginationResetDefaultPage={resetPagination}
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 20, 50]}
            paginationComponent={(paginationProps) => (
              <TenantPagination {...paginationProps} portalMenu className="ve-batch-pagination" />
            )}
            responsive
            persistTableHead
            highlightOnHover
            ariaLabel="Batch and class directory"
          />

        </div> : (
          <>
            {filteredRecords.length === 0 ? noData : (
              <div className="ve-batch-grid">
                {gridPageRecords.map((batch) => (
                  <article className="ve-batch-card" key={getBatchId(batch)}>
                    <div className="ve-batch-card-heading">
                      <span className="ve-batch-row-icon"><Boxes size={18} aria-hidden="true" /></span>
                      <div className="ve-batch-card-name"><h3>{batch.batch_name || "Untitled batch"}</h3><span>{batch.batch_code || "No code"}</span></div>
                      <StatusBadge active={isActiveBatch(batch)} />
                    </div>
                    <p className="ve-batch-card-description">{batch.description || "No description provided."}</p>
                    {isSuperAdmin && <div className="ve-batch-card-meta"><Building2 size={14} aria-hidden="true" /><span>{batch.tenant_name || "—"}</span></div>}
                    <div className="ve-batch-card-footer">
                      <span className="ve-batch-card-meta"><Users size={14} aria-hidden="true" />{Number(batch.total_students) || 0} students</span>
                      <span className="ve-batch-card-meta"><CalendarDays size={14} aria-hidden="true" />{formatDate(batch.created_at)}</span>
                    </div>
                    <div className="ve-batch-card-actions">
                      <button type="button" className="ve-batch-button ve-batch-button--secondary" onClick={() => openDetail(batch)}><Eye size={15} aria-hidden="true" />View</button>
                      {canManageRecord(batch) && <>
                        <button type="button" className="ve-batch-button ve-batch-button--secondary" onClick={() => setFormTarget({ mode: "edit", batch })}><Pencil size={15} aria-hidden="true" />Edit</button>
                        <button type="button" className="ve-batch-button ve-batch-button--danger" onClick={() => setDeleteTarget(batch)}><Trash2 size={15} aria-hidden="true" />Delete</button>
                      </>}
                    </div>
                  </article>
                ))}
              </div>
            )}
            {filteredRecords.length > 0 && <TenantPagination
              rowsPerPage={gridRowsPerPage}
              rowCount={filteredRecords.length}
              currentPage={gridPage}
              onChangePage={(page) => setGridPage(Math.min(gridPageCount, Math.max(1, page)))}
              onChangeRowsPerPage={(rows) => { setGridRowsPerPage(rows); setGridPage(1); }}
              paginationRowsPerPageOptions={[10, 20, 50]}
              portalMenu
              className="ve-batch-pagination"
            />}
          </>
        )}
          </>
        )}

        {status === "ready" && (
          <p className="ve-batch-result-count">
            {search || statusFilter !== "ALL"
              ? `${filteredRecords.length} matching ${
                  filteredRecords.length === 1 ? "batch" : "batches"
                }`
              : `${total} total ${total === 1 ? "batch" : "batches"}`}
          </p>
        )}
      </section>

      {formTarget && (
        <Modal
          isOpen
          onClose={() => !submitting && setFormTarget(null)}
          title={
            formTarget.mode === "edit"
              ? "Edit Batch / Class"
              : "Create Batch / Class"
          }
          description={
            formTarget.mode === "edit"
              ? "Update the batch name, code, and description."
              : "Add a batch or class to your active organization."
          }
          size="md"
          className="ve-batch-modal"
          closeOnEscape={!submitting}
          closeOnOverlay={!submitting}>
          <BatchForm
            key={`${formTarget.mode}-${getBatchId(formTarget.batch) || "new"}`}
            mode={formTarget.mode}
            batch={formTarget.batch}
            submitting={submitting}
            onCancel={() => !submitting && setFormTarget(null)}
            onSubmit={submitForm}
          />
        </Modal>
      )}

      {detail && (
        <Modal
          isOpen
          onClose={() => setDetail(null)}
          title="Batch details"
          description="View batch information and current student count."
          size="md"
          className="ve-batch-modal">
          {detail.status === "loading" ? (
            <BrandLoader variant="section" message="Loading batch details…" />
          ) : detail.status === "error" ? (
            <div className="ve-batch-detail-error" role="alert">
              <CircleAlert size={21} />
              <p>{detail.error}</p>

              <button
                type="button"
                className="ve-batch-button ve-batch-button--secondary"
                onClick={() => openDetail(detail.batch)}>
                Try again
              </button>
            </div>
          ) : (
            <div className="ve-batch-detail">
              <div>
                <span>Batch / Class</span>
                <strong>{detail.batch.batch_name || "—"}</strong>
              </div>

              <div>
                <span>Batch code</span>
                <strong>{detail.batch.batch_code || "—"}</strong>
              </div>

              <div>
                <span>Description</span>
                <p>{detail.batch.description || "No description provided."}</p>
              </div>

              {isSuperAdmin && (
                <div>
                  <span>Organization</span>
                  <strong>{detail.batch.tenant_name || "—"}</strong>
                </div>
              )}

              <div>
                <span>Students</span>
                <strong>{Number(detail.batch.total_students) || 0}</strong>
              </div>

              <div>
                <span>Status</span>
                <StatusBadge active={isActiveBatch(detail.batch)} />
              </div>

              <div>
                <span>Created</span>
                <strong>{formatDate(detail.batch.created_at, true)}</strong>
              </div>

              <div>
                <span>Last updated</span>
                <strong>{formatDate(detail.batch.updated_at, true)}</strong>
              </div>

              <div className="ve-batch-modal-actions">
                <button
                  type="button"
                  className="ve-batch-button ve-batch-button--secondary"
                  onClick={() => setDetail(null)}>
                  Close
                </button>

                {canManageRecord(detail.batch) && (
                  <button
                    type="button"
                    className="ve-batch-button ve-batch-button--primary"
                    onClick={() => {
                      setFormTarget({
                        mode: "edit",
                        batch: detail.batch,
                      });
                      setDetail(null);
                    }}>
                    <Pencil size={15} />
                    Edit batch
                  </button>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}

      {deleteTarget && (
        <Modal
          isOpen
          onClose={() => !deleting && setDeleteTarget(null)}
          title="Delete batch?"
          description="Confirm whether this batch should be removed."
          size="sm"
          className="ve-batch-modal"
          closeOnEscape={!deleting}
          closeOnOverlay={!deleting}>
          <div className="ve-batch-delete-copy">
            <p>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget.batch_name}</strong>?
            </p>

            <small>
              This action will be checked by the server before the batch is
              removed.
            </small>
          </div>

          <div className="ve-batch-modal-actions">
            <button
              type="button"
              className="ve-batch-button ve-batch-button--secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}>
              Cancel
            </button>

            <button
              type="button"
              className="ve-batch-button ve-batch-button--danger"
              onClick={confirmDelete}
              disabled={deleting}
              aria-busy={deleting}>
              {deleting ? <><RefreshCw size={15} className="ve-batch-inline-spinner" aria-hidden="true" />Deleting…</> : "Delete batch"}
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
