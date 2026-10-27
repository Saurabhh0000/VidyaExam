import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import {
  BookOpen,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleAlert,
  Download,
  FileDown,
  FileSpreadsheet,
  GraduationCap,
  Pencil,
  Plus,
  ShieldCheck,
  Search,
  UploadCloud,
  Trash2,
  Users,
  X,
  Eye,
  EyeOff,
  ChevronDown,
  Check,
} from "lucide-react";
import DataTable from "react-data-table-component";
import styled from "styled-components";
import toast from "../../../shared/components/ui/toast";

import { endSession } from "../../auth/state/sessionStore";
import useAuthState from "../../auth/utils/useAuthState";
import { ORGANIZATION_DASHBOARD } from "../../../app/roleRoutes";
import { isValidMobile } from "../../auth/utils/registration";
import {
  createOrganizationMember,
  deleteTenantUser,
  getOrganizationUsers,
  updateTenantUser,
} from "../services/organization.service";
import { getTenantDashboard } from "../services/tenant-dashboard.service";
import { getBatches } from "../../batches/services/batches.service";
import Modal from "../../../shared/components/ui/Modal";
import BrandLoader from "../../../shared/components/ui/BrandLoader";
import MasterWorkspaceSection from "../../../shared/components/MasterWorkspaceSection";
import BatchesPage from "../../batches/pages/BatchesPage";
import UserSettings from "../../account/pages/UserSettings";
import PageHeader from "../../../shared/components/ui/PageHeader";
import "../styles/organization-dashboard.css";

const TaxonomySection = lazy(
  () => import("../../super-admin/components/TaxonomySection"),
);

const VIEW_INFO = {
  employee: {
    title: "Employees",
    singular: "employee",
    description: "Review employee access for your organization.",
  },
  teacher: {
    title: "Teachers",
    singular: "teacher",
    description: "Manage teachers who support your learning community.",
  },
  student: {
    title: "Students",
    singular: "student",
    description: "Manage students connected to your organization.",
  },
};

const EMPTY_FORM = {
  full_name: "",
  email: "",
  mobile_no: "",
  password: "",
  role_name: "TEACHER",
};

function MenuSelect({
  value,
  options,
  onChange,
  ariaLabel,
  className = "",
  triggerClassName = "",
  optionsClassName = "",
  placement = "bottom",
  disabled = false,
  invalid = false,
}) {
  const [open, setOpen] = useState(false);
  const selectId = useId();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const optionsRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const selectedOption =
    options.find((option) => String(option.value) === String(value)) ||
    options[0];
  const portalOptions = Boolean(open && rootRef.current?.closest(".ve-modal"));

  useLayoutEffect(() => {
    if (!open) return undefined;
    const updateMenuPosition = () => {
      if (!portalOptions || !triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const width = Math.min(rect.width, window.innerWidth - 24);
      const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
      const spaceBelow = Math.max(0, window.innerHeight - rect.bottom - 12);
      const spaceAbove = Math.max(0, rect.top - 12);
      const preferTop = placement === "top" || (spaceBelow < 200 && spaceAbove > spaceBelow);
      const maxHeight = Math.max(90, Math.min(250, preferTop ? spaceAbove : spaceBelow));
      setMenuPosition(preferTop
        ? { position: "fixed", left, bottom: window.innerHeight - rect.top + 7, width, maxHeight, zIndex: 10020 }
        : { position: "fixed", left, top: rect.bottom + 7, width, maxHeight, zIndex: 10020 });
    };
    updateMenuPosition();
    const selected = optionsRef.current?.querySelector(
      '[aria-selected="true"]',
    );
    (selected || optionsRef.current?.querySelector('[role="option"]'))?.focus();
    const closeOutside = (event) => {
      if (!rootRef.current?.contains(event.target) && !optionsRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, portalOptions, placement]);

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      const buttons = [
        ...(optionsRef.current?.querySelectorAll('[role="option"]') || []),
      ];
      if (!open) {
        event.preventDefault();
        setOpen(true);
        return;
      }
      const currentIndex = buttons.indexOf(document.activeElement);
      const nextIndex =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? buttons.length - 1
            : (currentIndex +
                (event.key === "ArrowDown" ? 1 : -1) +
                buttons.length) %
              buttons.length;
      event.preventDefault();
      buttons[nextIndex]?.focus();
    }
  }

  function choose(option) {
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div
      className={`org-menu-select org-menu-select--${placement} ${className}`.trim()}
      ref={rootRef}
      onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        className={`org-menu-select-trigger ${triggerClassName}`.trim()}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={selectId}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}>
        <span>{selectedOption?.label}</span>
        <ChevronDown size={17} aria-hidden="true" />
      </button>
      {open && (() => {
        const menu = <div
          className={`org-menu-select-options ${optionsClassName}`.trim()}
          id={selectId}
          role="listbox"
          aria-label={ariaLabel}
          style={portalOptions ? menuPosition || undefined : undefined}
          ref={optionsRef}>
          {options.map((option) => (
            <button
              key={String(option.value)}
              type="button"
              role="option"
              aria-selected={String(option.value) === String(value)}
              tabIndex={0}
              onClick={() => choose(option)}>
              {option.label}
              {String(option.value) === String(value) && (
                <Check size={16} aria-hidden="true" />
              )}
            </button>
          ))}
        </div>;
        return portalOptions ? createPortal(menu, document.body) : menu;
      })()}
    </div>
  );
}

function OrganizationPagination({
  rowsPerPage,
  rowCount,
  currentPage,
  onChangePage,
  onChangeRowsPerPage,
  paginationRowsPerPageOptions = [],
}) {
  const pageCount = Math.max(1, Math.ceil(rowCount / rowsPerPage));
  const firstRow = rowCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const lastRow = Math.min(currentPage * rowsPerPage, rowCount);
  const sizeOptions = paginationRowsPerPageOptions.map((size) => ({
    value: size,
    label: String(size),
  }));
  const changePage = (page) =>
    onChangePage(Math.min(pageCount, Math.max(1, page)), rowCount);

  return (
    <div className="org-custom-pagination" aria-label="Table pagination">
      <label className="org-page-size-label">
        Rows per page{" "}
        <MenuSelect
          value={rowsPerPage}
          options={sizeOptions}
          onChange={(size) => onChangeRowsPerPage(Number(size), currentPage)}
          ariaLabel="Rows per page"
          placement="top"
          className="org-page-size-menu"
        />
      </label>
      <span className="org-page-range" aria-live="polite">
        {firstRow}–{lastRow} of {rowCount}
      </span>
      <div className="org-page-navigation">
        <button
          type="button"
          aria-label="First page"
          disabled={currentPage <= 1}
          onClick={() => changePage(1)}>
          <ChevronsLeft size={18} />
        </button>
        <button
          type="button"
          aria-label="Previous page"
          disabled={currentPage <= 1}
          onClick={() => changePage(currentPage - 1)}>
          <ChevronLeft size={19} />
        </button>
        <button
          type="button"
          aria-label="Next page"
          disabled={currentPage >= pageCount}
          onClick={() => changePage(currentPage + 1)}>
          <ChevronRight size={19} />
        </button>
        <button
          type="button"
          aria-label="Last page"
          disabled={currentPage >= pageCount}
          onClick={() => changePage(pageCount)}>
          <ChevronsRight size={18} />
        </button>
      </div>
    </div>
  );
}

function validateMember(form) {
  const errors = {};
  const fullName = form.full_name.trim();
  const email = form.email.trim();
  if (!fullName) errors.full_name = "Enter the member’s full name.";
  else if (fullName.length < 2)
    errors.full_name = "Name must contain at least 2 characters.";
  else if (fullName.length > 100)
    errors.full_name = "Name must be 100 characters or fewer.";
  if (!email) errors.email = "Enter an email address.";
  else if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
    errors.email = "Enter a valid email address.";
  if (!form.mobile_no.trim()) errors.mobile_no = "Enter a mobile number.";
  else if (!isValidMobile(form.mobile_no))
    errors.mobile_no = "Enter a valid 10-digit Indian mobile number.";
  if (!form.password) errors.password = "Enter a password.";
  else if (form.password.length < 8)
    errors.password = "Use at least 8 characters for the password.";
  else if (form.password.length > 128)
    errors.password = "Password must be 128 characters or fewer.";
  if (!["TEACHER", "STUDENT"].includes(form.role_name))
    errors.role_name = "Choose Teacher or Student.";
  return errors;
}

function parseCsv(text) {
  const source = text.replace(/^\uFEFF/, "");
  const records = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(field);
      field = "";
      if (row.some((value) => value.trim())) records.push(row);
      row = [];
    } else field += character;
  }
  if (quoted) throw new Error("The CSV contains an unclosed quoted value.");
  row.push(field);
  if (row.some((value) => value.trim())) records.push(row);
  if (records.length < 2)
    throw new Error("The CSV needs a header and at least one member row.");

  const normalizeHeader = (header) => {
    const normalized = header
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    return (
      {
        name: "full_name",
        fullname: "full_name",
        email_address: "email",
        mobile: "mobile_no",
        mobile_number: "mobile_no",
        phone: "mobile_no",
        phone_number: "mobile_no",
        role: "role_name",
        batch: "batch_id",
        class_id: "batch_id",
      }[normalized] || normalized
    );
  };
  const headers = records[0].map(normalizeHeader);
  const required = ["full_name", "email", "mobile_no", "password", "role_name"];
  const missing = required.filter((header) => !headers.includes(header));
  if (missing.length)
    throw new Error(`Missing CSV columns: ${missing.join(", ")}.`);

  const seenEmails = new Set();
  const seenMobiles = new Set();
  return records.slice(1).map((values, index) => {
    const form = Object.fromEntries(
      headers.map((header, column) => [header, (values[column] || "").trim()]),
    );
    form.email = String(form.email || "").toLowerCase();
    form.role_name = String(form.role_name || "").toUpperCase();
    const errors = Object.values(validateMember(form));
    if (form.role_name === "STUDENT" && !form.batch_id)
      errors.push("Batch / Class is required for student rows.");
    const emailKey = form.email.toLowerCase();
    const mobileKey = form.mobile_no;
    if (form.password && new TextEncoder().encode(form.password).length > 72)
      errors.push("Password must be at most 72 UTF-8 bytes.");
    if (emailKey && seenEmails.has(emailKey))
      errors.push("Email is repeated in this CSV.");
    if (mobileKey && seenMobiles.has(mobileKey))
      errors.push("Mobile number is repeated in this CSV.");
    if (emailKey) seenEmails.add(emailKey);
    if (mobileKey) seenMobiles.add(mobileKey);
    return {
      ...form,
      rowNumber: index + 2,
      status: errors.length ? "invalid" : "ready",
      error: errors.join(" "),
      validationErrors: errors,
    };
  });
}

function getRequestError(error) {
  const status = error?.response?.status;
  const backendErrors = error?.response?.data?.errors;
  const backendMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.detail ||
    (Array.isArray(backendErrors) ? backendErrors.join(" ") : "");
  if (status === 401)
    return {
      message: "Your session has expired. Please sign in again.",
      expired: true,
    };
  if (status === 403)
    return {
      message:
        backendMessage ||
        "You don’t have permission to add organization members.",
    };
  if (status === 409)
    return {
      message:
        backendMessage ||
        "An account with this email or mobile number already exists.",
    };
  if (status === 400 || status === 422)
    return {
      message: backendMessage || "Check the member details and try again.",
    };
  if (status === 404 || status === 405)
    return {
      message:
        backendMessage ||
        "Member creation isn’t available from this organization endpoint yet.",
    };
  if (status === 429)
    return {
      message:
        backendMessage || "Too many requests. Wait a moment and try again.",
    };
  if (status >= 500)
    return {
      message:
        backendMessage ||
        "The service is unavailable right now. Please try again later.",
    };
  if (!error?.response)
    return {
      message:
        error?.message ||
        "Unable to connect. Check your connection and try again.",
    };
  return {
    message: backendMessage || "Unable to add this member. Please try again.",
  };
}

function AddMemberModal({
  initialRole,
  onClose,
  onCreated,
  tenantAvailable,
  tenantId,
  quota,
}) {
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    role_name: initialRole,
    batch_id: "",
  });
  const [errors, setErrors] = useState(() =>
    tenantAvailable
      ? {}
      : {
          form: "No active organization is linked to this account. Sign in again before adding members.",
        },
  );
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [batches, setBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batchesError, setBatchesError] = useState("");
  const requestInFlight = useRef(false);
  const navigate = useNavigate();

  const isStudent = form.role_name === "STUDENT";
  const remaining = quota?.[isStudent ? "students" : "teachers"]?.remaining;
  const quotaExhausted =
    remaining != null &&
    Number.isFinite(Number(remaining)) &&
    Number(remaining) <= 0;

  // Load batches while the member modal is open so the field is ready when
  // Student is selected.
  useEffect(() => {
    if (!tenantAvailable || !tenantId) {
      setBatches([]);
      setBatchesError("");
      setBatchesLoading(false);
      return undefined;
    }

    let active = true;

    async function loadOrganizationBatches() {
      setBatchesLoading(true);
      setBatchesError("");

      try {
        const result = await getBatches();

        const responseRows = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : Array.isArray(result?.data?.data)
              ? result.data.data
              : [];

        // Never offer batches explicitly belonging to another organization.
        const organizationBatches = responseRows.filter((batch) => {
          const batchTenantId = batch?.tenant_id ?? batch?.tenantId;

          return (
            batchTenantId == null || String(batchTenantId) === String(tenantId)
          );
        });

        if (active) {
          setBatches(organizationBatches);
          setForm((current) => {
            const selectedStillExists = organizationBatches.some(
              (batch) =>
                String(batch.batch_id ?? batch.batchId ?? batch.id) ===
                String(current.batch_id),
            );

            return selectedStillExists ? current : { ...current, batch_id: "" };
          });
        }
      } catch (error) {
        if (active) {
          setBatches([]);
          setBatchesError(
            error?.response?.data?.message ||
              error?.message ||
              "Unable to load batches. Please try again.",
          );
        }
      } finally {
        if (active) setBatchesLoading(false);
      }
    }

    loadOrganizationBatches();

    return () => {
      active = false;
    };
  }, [tenantAvailable, tenantId]);

  function updateField(event) {
    const { name, value } = event.target;
    const nextValue =
      name === "mobile_no" ? value.replace(/\D/g, "").slice(0, 10) : value;

    const nextForm = { ...form, [name]: nextValue };
    setForm(nextForm);

    setErrors((current) => ({
      ...current,
      [name]: touched[name] ? validateMember(nextForm)[name] || "" : "",
      form: "",
    }));
  }

  function validateField(event) {
    const { name } = event.target;

    setTouched((current) => ({
      ...current,
      [name]: true,
    }));

    setErrors((current) => ({
      ...current,
      [name]: validateMember(form)[name] || "",
    }));
  }

  function chooseRole(roleName) {
    const nextForm = {
      ...form,
      role_name: roleName,
      // A batch is relevant only to students.
      batch_id: roleName === "STUDENT" ? form.batch_id : "",
    };

    setForm(nextForm);
    setTouched((current) => ({
      ...current,
      role_name: true,
    }));

    setErrors((current) => ({
      ...current,
      role_name: validateMember(nextForm).role_name || "",
      batch_id: "",
      form: "",
    }));

  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (requestInFlight.current) return;

    if (!tenantAvailable) {
      setErrors((current) => ({
        ...current,
        form: "No active organization is linked to this account. Sign in again before adding members.",
      }));
      return;
    }

    const nextErrors = validateMember(form);

    if (isStudent && !form.batch_id) {
      nextErrors.batch_id = "Select a batch for this student.";
    }

    setTouched({
      full_name: true,
      email: true,
      mobile_no: true,
      password: true,
      role_name: true,
      batch_id: true,
    });

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      toast.warning("Please correct the highlighted fields.");
      document.querySelector(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus();
      return;
    }

    if (isStudent && batchesLoading) {
      setErrors((current) => ({
        ...current,
        form: "Wait for the organization batches to finish loading.",
      }));
      return;
    }

    if (isStudent && batches.length === 0) {
      setErrors((current) => ({
        ...current,
        form: "Create a batch before adding a student.",
      }));
      return;
    }

    if (quotaExhausted) {
      setErrors({
        form: `The ${form.role_name.toLowerCase()} quota is exhausted for the current plan.`,
      });
      return;
    }

    requestInFlight.current = true;
    setSubmitting(true);

    try {
      const result = await createOrganizationMember({
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        mobile_no: form.mobile_no.trim(),
        password: form.password,
        role_name: form.role_name,
        ...(isStudent ? { batch_id: form.batch_id } : {}),
      });

      if (result?.success === false) {
        throw new Error(result.message || "The member could not be created.");
      }

      toast.success("Member added successfully.", {
        description: isStudent
          ? "The student account was created with the selected batch."
          : "The teacher can now access your organization.",
      });

      await onCreated();
      onClose();
    } catch (error) {
      const failure = getRequestError(error);

      toast.error(
        failure.expired
          ? "Your session has expired"
          : "Couldn’t add this member",
        { description: failure.message },
      );

      if (failure.expired) {
        endSession();
        navigate("/login", { replace: true });
      } else {
        setErrors((current) => ({
          ...current,
          form: failure.message,
        }));
      }
    } finally {
      requestInFlight.current = false;
      setSubmitting(false);
    }
  }

  const closeSafely = () => {
    if (!submitting) onClose();
  };

  return (
    <Modal
      isOpen
      onClose={closeSafely}
      closeOnEscape={!submitting}
      closeOnOverlay={!submitting}
      title="Add New Member"
      description="Create a teacher or student account for your organization."
      size="lg"
      className="org-member-modal">
      <form className="org-member-form" onSubmit={handleSubmit} noValidate>
        <label className="org-member-field">
          <span>
            Full Name <b>*</b>
          </span>
          <input
            name="full_name"
            value={form.full_name}
            onChange={updateField}
            onBlur={validateField}
            autoComplete="name"
            aria-invalid={Boolean(errors.full_name)}
            required
          />
          {errors.full_name && <small>{errors.full_name}</small>}
        </label>

        <label className="org-member-field">
          <span>
            Email Address <b>*</b>
          </span>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={updateField}
            onBlur={validateField}
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            required
          />
          {errors.email && <small>{errors.email}</small>}
        </label>

        <label className="org-member-field">
          <span>
            Mobile Number <b>*</b>
          </span>
          <input
            name="mobile_no"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={form.mobile_no}
            onChange={updateField}
            onBlur={validateField}
            autoComplete="tel-national"
            aria-invalid={Boolean(errors.mobile_no)}
            required
          />
          {errors.mobile_no && <small>{errors.mobile_no}</small>}
        </label>

        <label className="org-member-field">
          <span>
            Password <b>*</b>
          </span>
          <span className="org-member-password">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={updateField}
              onBlur={validateField}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              required
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((current) => !current)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
          {errors.password && <small>{errors.password}</small>}
          <small className="org-member-hint">Use at least 8 characters.</small>
        </label>

        <div className="org-member-field org-member-role-field">
          <span id="org-member-role-label">
            Role <b>*</b>
          </span>
          <MenuSelect
            value={form.role_name}
            options={[
              { value: "TEACHER", label: "Teacher" },
              { value: "STUDENT", label: "Student" },
            ]}
            onChange={chooseRole}
            ariaLabel="Choose member role"
            className="org-member-role-select"
            triggerClassName="org-member-role-trigger"
            optionsClassName="org-member-role-options"
            invalid={Boolean(errors.role_name)}
            disabled={submitting}
          />

          {errors.role_name && <small>{errors.role_name}</small>}
        </div>

        {isStudent && <div className="org-member-field org-member-batch-field">
          <span>Batch / Class <b>*</b></span>
          <MenuSelect
            value={form.batch_id}
            options={[
              {
                value: "",
                label: batchesLoading
                  ? "Loading batches…"
                  : batchesError
                    ? "Unable to load batches"
                    : batches.length
                      ? "Select a batch"
                      : "No batches available",
              },
              ...batches.map((batch) => {
                const id = batch.batch_id ?? batch.batchId ?? batch.id;
                const name = batch.batch_name ?? batch.batchName ?? "Unnamed batch";
                const code = batch.batch_code ?? batch.batchCode;
                return { value: String(id), label: `${name}${code ? ` (${code})` : ""}` };
              }),
            ]}
            onChange={(batchId) => {
              setForm((current) => ({ ...current, batch_id: String(batchId) }));
              setErrors((current) => ({ ...current, batch_id: "", form: "" }));
            }}
            ariaLabel="Choose a batch or class"
            className="org-member-batch-select"
            triggerClassName="org-member-role-trigger"
            optionsClassName="org-member-role-options"
            invalid={Boolean(errors.batch_id)}
            disabled={batchesLoading || submitting || Boolean(batchesError) || batches.length === 0}
          />
          {errors.batch_id && <small>{errors.batch_id}</small>}
          {batchesError && <small role="alert">{batchesError}</small>}
          {!batchesLoading && !batchesError && batches.length === 0 && (
            <small>No batches found for this organization. Create a batch first.</small>
          )}
        </div>}

        {quotaExhausted && (
          <p className="org-member-form-error" role="status">
            The {form.role_name.toLowerCase()} quota is exhausted for the
            current plan.
          </p>
        )}

        {errors.form && (
          <p className="org-member-form-error" role="alert">
            {errors.form}
          </p>
        )}

        <div className="org-member-form-actions">
          <button
            type="button"
            className="org-dashboard-button org-dashboard-button--quiet org-member-button--cancel"
            disabled={submitting}
            onClick={closeSafely}>
            Cancel
          </button>

          <button
            type="submit"
            className="org-dashboard-button org-dashboard-button--primary org-member-button--submit"
            disabled={
              submitting ||
              !tenantAvailable ||
              quotaExhausted ||
              (isStudent &&
                (batchesLoading ||
                  batches.length === 0 ||
                  Boolean(batchesError)))
            }
            aria-busy={submitting}>
            {submitting ? "Adding member…" : "Add member"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function BulkMemberModal({ onClose, onCompleted, tenantAvailable, tenantId }) {
  const [rows, setRows] = useState([]);
  const [batches, setBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(Boolean(tenantAvailable && tenantId));
  const [batchesError, setBatchesError] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);
  const hasStudentRows = rows.some((row) => row.role_name === "STUDENT");
  const readyCount = rows.filter((row) => row.status === "ready").length;
  const successCount = rows.filter((row) => row.status === "success").length;
  const failedCount = rows.filter((row) =>
    ["invalid", "failed"].includes(row.status),
  ).length;
  const finished = !uploading && processed > 0;

  useEffect(() => {
    if (!tenantAvailable || !tenantId) {
      setBatches([]);
      setBatchesLoading(false);
      setBatchesError("");
      return undefined;
    }
    let active = true;
    setBatchesLoading(true);
    setBatchesError("");
    getBatches()
      .then((result) => {
        if (!active) return;
        const responseRows = Array.isArray(result?.data) ? result.data : [];
        setBatches(responseRows.filter((batch) => {
          const batchTenantId = batch?.tenant_id ?? batch?.tenantId;
          return batchTenantId == null || String(batchTenantId) === String(tenantId);
        }));
      })
      .catch((error) => {
        if (active) setBatchesError(error?.message || "Unable to load batches for this organization.");
      })
      .finally(() => { if (active) setBatchesLoading(false); });
    return () => { active = false; };
  }, [tenantAvailable, tenantId]);

  useEffect(() => {
    if (batchesLoading) return;
    setRows((current) => {
      let changed = false;
      const nextRows = current.map((row) => {
      if (!["ready", "invalid"].includes(row.status) || row.role_name !== "STUDENT") return row;
      const validationErrors = [...(row.validationErrors || [])].filter((message) =>
        message !== "Unable to verify the student batch for this organization." &&
        message !== "Batch / Class does not match a batch in this organization." &&
        message !== "Batch / Class is required for student rows.",
      );
      if (!row.batch_id) validationErrors.push("Batch / Class is required for student rows.");
      else if (batchesError) validationErrors.push("Unable to verify the student batch for this organization.");
      else if (!batches.some((batch) => String(batch.batch_id ?? batch.batchId ?? batch.id) === String(row.batch_id)))
        validationErrors.push("Batch / Class does not match a batch in this organization.");
      const nextRow = {
        ...row,
        validationErrors,
        status: validationErrors.length ? "invalid" : "ready",
        error: validationErrors.join(" "),
      };
      if (nextRow.status !== row.status || nextRow.error !== row.error) changed = true;
      return changed ? nextRow : row;
      });
      return changed ? nextRows : current;
    });
  }, [rows, batches, batchesError, batchesLoading]);

  async function loadFile(file) {
    setFileError("");
    setProcessed(0);
    setRows([]);
    setFileName("");
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      setFileError("Choose a .csv file to continue.");
      return;
    }
    setFileName(file.name);
    try {
      const parsed = parseCsv(await file.text());
      setRows(parsed);
    } catch (error) {
      setFileName("");
      setFileError(error.message || "Unable to read this CSV file.");
    }
  }

  async function uploadRows() {
    if (!tenantAvailable || uploading || !readyCount || fileError || (hasStudentRows && batchesLoading)) return;
    setUploading(true);
    setProcessed(0);
    const readyRows = rows.filter((row) => row.status === "ready");
    setUploadTotal(readyRows.length);
    let completedCount = 0;
    let succeeded = 0;
    let failed = rows.filter((row) => row.status === "invalid").length;
    for (const row of readyRows) {
      setRows((current) =>
        current.map((item) =>
          item.rowNumber === row.rowNumber
            ? { ...item, status: "uploading", error: "" }
            : item,
        ),
      );
      try {
        const result = await createOrganizationMember({
          full_name: row.full_name,
          email: row.email,
          mobile_no: row.mobile_no,
          password: row.password,
          role_name: row.role_name,
          ...(row.role_name === "STUDENT" ? { batch_id: row.batch_id } : {}),
        });
        if (result?.success === false)
          throw new Error(result.message || "The server rejected this member.");
        succeeded += 1;
        setRows((current) =>
          current.map((item) =>
            item.rowNumber === row.rowNumber
              ? { ...item, status: "success", error: "Added" }
              : item,
          ),
        );
      } catch (requestError) {
        const failure = getRequestError(requestError);
        failed += 1;
        setRows((current) =>
          current.map((item) =>
            item.rowNumber === row.rowNumber
              ? { ...item, status: "failed", error: failure.message }
              : item,
          ),
        );
        if (failure.expired) {
          endSession();
          toast.error("Your session has expired", {
            description: failure.message,
          });
          setUploading(false);
          await onCompleted();
          return;
        }
      }
      completedCount += 1;
      setProcessed(completedCount);
    }
    setUploading(false);
    if (readyRows.length) {
      await onCompleted();
      if (!failed) toast.success(`${succeeded} members added successfully.`);
      else if (succeeded)
        toast.warning("Bulk upload completed with some failures.", {
          description: `${succeeded} added, ${failed} not added.`,
        });
      else
        toast.error("No members were added.", {
          description: `${failed} rows need attention.`,
        });
    }
  }

  function downloadTemplate() {
    const template = "full_name,email,mobile_no,password,role_name,batch_id\r\n";
    downloadBlob(
      new Blob(["\uFEFF", template], { type: "text/csv;charset=utf-8" }),
      "vidyaexam-members-template.csv",
    );
  }

  const closeSafely = () => {
    if (!uploading) onClose();
  };
  return (
    <Modal
      isOpen
      onClose={closeSafely}
      closeOnEscape={!uploading}
      closeOnOverlay={!uploading}
      title="Add Members in Bulk"
      description="Upload a CSV, review each row, then add valid teachers and students to this organization."
      size="xl"
      className="org-member-modal org-bulk-modal">
      <div className="org-bulk-template-row">
        <span>
          <FileSpreadsheet size={17} /> Required columns: full_name, email,
          mobile_no, password, role_name, batch_id (required for STUDENT rows)
        </span>
        <button type="button" onClick={downloadTemplate}>
          Download template
        </button>
      </div>
      {batchesLoading && <p className="org-bulk-batch-note" role="status">Loading this organization’s batches to validate student rows…</p>}
      {!batchesLoading && batchesError && <p className="org-bulk-file-error" role="alert">{batchesError} Student rows cannot be verified until batches load.</p>}
      {!batchesLoading && !batchesError && batches.length === 0 && <p className="org-bulk-batch-note" role="status">No batches are available. Student rows need an existing batch; teacher rows can still be uploaded.</p>}
      <div
        className={`org-bulk-dropzone${dragging ? " is-dragging" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          loadFile(event.dataTransfer.files?.[0]);
        }}>
        <span className="org-bulk-upload-icon">
          <UploadCloud size={23} />
        </span>
        <strong>{fileName || "Drop your CSV file here"}</strong>
        <small>
          CSV files only · Passwords are used for account creation and never
          displayed
        </small>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          aria-label="Choose members CSV file"
          onChange={(event) => {
            loadFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          className="org-dashboard-button org-dashboard-button--secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}>
          Choose CSV
        </button>
      </div>
      {fileError && (
        <p className="org-bulk-file-error" role="alert">
          {fileError}
        </p>
      )}
      {!tenantAvailable && (
        <p className="org-bulk-file-error" role="alert">
          No active organization is linked to this account.
        </p>
      )}
      {rows.length > 0 && (
        <>
          <div className="org-bulk-summary" aria-live="polite">
            <div>
              <strong>{rows.length}</strong>
              <span>Total rows</span>
            </div>
            <div>
              <strong>{readyCount}</strong>
              <span>Ready to add</span>
            </div>
            <div className="is-success">
              <strong>{successCount}</strong>
              <span>Added</span>
            </div>
            <div className="is-failed">
              <strong>{failedCount}</strong>
              <span>Not added</span>
            </div>
          </div>
          {uploading && (
            <div className="org-bulk-progress">
              <span>
                Uploading members sequentially… {processed + 1} of {uploadTotal}
              </span>
              <div>
                <i
                  style={{
                    width: `${uploadTotal ? (processed / uploadTotal) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}
          <div className="org-bulk-table-wrap">
            <table className="org-bulk-table">
              <thead>
                <tr>
                  <th>CSV row</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Role</th>
                  <th>Batch / Class</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.rowNumber}>
                    <td>{row.rowNumber}</td>
                    <td>{row.full_name || "—"}</td>
                    <td>{row.email || "—"}</td>
                    <td>{row.mobile_no || "—"}</td>
                    <td>
                      {row.role_name === "STUDENT"
                        ? "Student"
                        : row.role_name === "TEACHER"
                          ? "Teacher"
                          : row.role_name || "—"}
                    </td>
                    <td>{batches.find((batch) => String(batch.batch_id ?? batch.batchId ?? batch.id) === String(row.batch_id))?.batch_name || row.batch_id || "—"}</td>
                    <td>
                      <span className={`org-bulk-row-status is-${row.status}`}>
                        {row.status === "ready"
                          ? "Ready"
                          : row.status === "uploading"
                            ? "Adding…"
                            : row.status === "success"
                              ? "Added"
                              : row.status === "invalid"
                                ? row.error
                                : row.error}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="org-bulk-security-note">
            Passwords are not shown in the preview or result table. Only valid
            rows are submitted.
          </p>
        </>
      )}
      <div className="org-member-form-actions">
        <button
          type="button"
          className="org-dashboard-button org-dashboard-button--quiet"
          onClick={closeSafely}
          disabled={uploading}>
          {finished ? "Close" : "Cancel"}
        </button>
        <button
          type="button"
          className="org-dashboard-button org-dashboard-button--primary"
          onClick={uploadRows}
          disabled={
            uploading ||
            !readyCount ||
            !tenantAvailable ||
            Boolean(fileError) ||
            (hasStudentRows && batchesLoading) ||
            finished
          }
          aria-busy={uploading}>
          {uploading
            ? `Adding ${processed + 1} of ${uploadTotal}…`
            : finished
              ? "Upload completed"
              : `Add ${readyCount || "valid"} members`}
        </button>
      </div>
    </Modal>
  );
}

const TableShell = styled.div`
  min-width: 0;
  .rdt_Table {
    border: 1px solid #e2eae9;
    border-radius: 13px;
    overflow: hidden;
  }
  .rdt_TableHeadRow {
    border-bottom: 1px solid #e2eae9;
  }
  .rdt_TableRow {
    transition: background-color 140ms ease;
  }
  .rdt_TableRow:hover {
    background: #f4faf8;
  }
  .rdt_Pagination {
    gap: 8px;
    padding-inline: 12px;
    color: #64748b;
    font-family: var(--font-family-base);
    font-size: 13px;
  }
  .rdt_Pagination select {
    min-height: 38px;
    padding: 0 30px 0 11px;
    color: #172b4d;
    background-color: #fff;
    border: 1px solid #dce6e5;
    border-radius: 9px;
    font: inherit;
  }
  .rdt_Pagination button {
    width: 34px;
    height: 34px;
    color: #52637a;
    border-radius: 8px;
    transition:
      color 140ms ease,
      background-color 140ms ease;
  }
  .rdt_Pagination button:hover:not(:disabled) {
    color: #0f766e;
    background: #e5f5f2;
  }
  @media (prefers-reduced-motion: reduce) {
    .rdt_TableRow {
      transition: none;
    }
  }
`;

const TABLE_STYLES = {
  table: { style: { backgroundColor: "#fff" } },
  headRow: {
    style: {
      minHeight: "48px",
      backgroundColor: "#f7faf9",
      color: "#52637a",
      fontSize: "12px",
      fontWeight: 750,
    },
  },
  headCells: { style: { paddingLeft: "14px", paddingRight: "14px" } },
  rows: { style: { minHeight: "68px", color: "#172b4d", fontSize: "13px" } },
  cells: { style: { paddingLeft: "14px", paddingRight: "14px" } },
  pagination: {
    style: {
      borderTop: "1px solid #e2eae9",
      color: "#64748b",
      minHeight: "58px",
    },
  },
};

function formatDate(value, includeTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(
    undefined,
    includeTime
      ? { dateStyle: "medium", timeStyle: "short" }
      : { dateStyle: "medium" },
  ).format(date);
}

function roleLabel(value) {
  return (
    { ADMIN: "Admin", TEACHER: "Teacher", STUDENT: "Student" }[
      String(value || "").toUpperCase()
    ] ||
    value ||
    "Unknown"
  );
}

function tenantMutationError(error, action) {
  const statusCode = error?.response?.status;
  const message = error?.response?.data?.message || "";
  if (
    message &&
    !/(stack trace|syntax error|sqlstate|database error|constraint failed| at .*\(.*:\d+:\d+\))/i.test(
      message,
    )
  )
    return message;
  if (statusCode === 401 || statusCode === 403)
    return "Your session may have expired or you may not have permission. Sign in again and retry.";
  if (statusCode === 404 || statusCode === 405)
    return `The tenant-user ${action} endpoint is not available in the connected backend yet.`;
  if (!error?.response)
    return "The server could not be reached. Check your connection and try again.";
  return `Unable to ${action} this user right now. Please try again.`;
}
function initials(value) {
  return (
    String(value || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

function exportCsv(rows) {
  const columns = [
    "Full Name",
    "Email",
    "Mobile Number",
    "Role",
    "Account Status",
    "Joined Date",
    "Last Login",
  ];
  const values = rows.map((row) => [
    row.full_name,
    row.email,
    row.mobile_no,
    roleLabel(row.role_name),
    row.user_is_active ? "Active" : "Inactive",
    formatDate(row.joined_at),
    row.last_login_at ? formatDate(row.last_login_at, true) : "Never logged in",
  ]);
  const csv = [columns, ...values]
    .map((line) =>
      line
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  downloadBlob(
    blob,
    `vidyaexam-organization-users-${new Date().toISOString().slice(0, 10)}.csv`,
  );
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function pdfEscape(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/([\\()])/g, "\\$1");
}
function wrapPdfText(value, width) {
  const words = String(value ?? "—").split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    let part = word;
    while (part.length > width) {
      if (line) {
        lines.push(line);
        line = "";
      }
      lines.push(part.slice(0, width));
      part = part.slice(width);
    }
    if (!part) return;
    if (line && `${line} ${part}`.length > width) {
      lines.push(line);
      line = part;
    } else line = line ? `${line} ${part}` : part;
  });
  if (line) lines.push(line);
  return lines.length ? lines : ["—"];
}

async function loadReportLogo() {
  const image = new Image();
  image.src = `${import.meta.env.BASE_URL}logo.png`;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context)
    throw new Error(
      "The organization logo could not be prepared for the report.",
    );
  context.fillStyle = "#172B4D";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0);
  const jpeg = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("The organization logo could not be encoded.")),
      "image/jpeg",
      0.96,
    ),
  );
  return {
    bytes: new Uint8Array(await jpeg.arrayBuffer()),
    width: canvas.width,
    height: canvas.height,
  };
}

function joinBytes(parts) {
  const size = parts.reduce((total, part) => total + part.length, 0);
  const joined = new Uint8Array(size);
  let offset = 0;
  parts.forEach((part) => {
    joined.set(part, offset);
    offset += part.length;
  });
  return joined;
}

async function buildPdf(rows, organizationName, appliedRole, appliedStatus) {
  const pageWidth = 842;
  const left = 42;
  const colWidths = [28, 110, 155, 83, 74, 81, 102, 123];
  const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
  const headings = [
    "#",
    "Name",
    "Email",
    "Mobile",
    "Role",
    "Status",
    "Joined",
    "Last login",
  ];
  const records = rows.map((user, index) => [
    String(index + 1),
    user.full_name || "—",
    user.email || "—",
    user.mobile_no || "—",
    roleLabel(user.role_name),
    user.user_is_active === true
      ? "Active"
      : user.user_is_active === false
        ? "Inactive"
        : "Unknown",
    formatDate(user.joined_at),
    user.last_login_at
      ? formatDate(user.last_login_at, true)
      : "Never logged in",
  ]);
  const logo = await loadReportLogo();
  const logoRef = 5;
  const pages = [];
  let commands;
  let cursorY;
  const encode = (value) => new TextEncoder().encode(value);
  const rect = (x, y, width, height, color) =>
    `q ${color} rg ${x} ${y} ${width} ${height} re f Q`;
  const rule = (x1, y1, x2, y2, color = "0.86 0.90 0.91") =>
    `q ${color} RG 0.7 w ${x1} ${y1} m ${x2} ${y2} l S Q`;
  const text = (
    value,
    x,
    y,
    size = 8,
    color = "0.20 0.27 0.37",
    bold = false,
  ) =>
    `BT /${bold ? "F2" : "F1"} ${size} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm (${pdfEscape(value)}) Tj ET`;
  const beginPage = () => {
    commands = [];
    commands.push(rect(0, 466, pageWidth, 129, "0.09 0.17 0.30"));
    commands.push(rect(0, 462, pageWidth, 4, "0.06 0.46 0.43"));
    const logoWidth = 190;
    const logoHeight = (logoWidth * logo.height) / logo.width;
    commands.push(`q ${logoWidth} 0 0 ${logoHeight} 34 511 cm /Logo Do Q`);
    commands.push(text("Organization Users", 252, 553, 19, "1 1 1", true));
    const orgLines = wrapPdfText(organizationName || "Organization", 52);
    commands.push(text(orgLines[0], 253, 531, 10, "0.88 0.94 0.96", true));
    if (orgLines[1])
      commands.push(text(orgLines[1], 253, 517, 9, "0.88 0.94 0.96", true));
    commands.push(
      text(
        `Created ${new Date().toLocaleString()}`,
        253,
        orgLines[1] ? 499 : 511,
        8,
        "0.73 0.81 0.87",
      ),
    );

    commands.push(rect(left, 420, tableWidth, 29, "0.90 0.96 0.95"));
    const meta = [
      { label: "TOTAL USERS", value: String(rows.length), width: 180 },
      { label: "ROLE FILTER", value: appliedRole, width: 220 },
      { label: "STATUS FILTER", value: appliedStatus, width: tableWidth - 400 },
    ];
    let metaX = left + 11;
    meta.forEach((item, index) => {
      commands.push(
        rect(
          metaX,
          431,
          4,
          9,
          index === 0 ? "0.06 0.46 0.43" : "0.19 0.57 0.54",
        ),
      );
      commands.push(
        text(item.label, metaX + 9, 439, 6.2, "0.36 0.45 0.54", true),
      );
      commands.push(
        text(item.value, metaX + 9, 426, 8.5, "0.09 0.17 0.30", true),
      );
      metaX += item.width;
    });

    commands.push(rect(left, 389, tableWidth, 24, "0.09 0.17 0.30"));
    let headerX = left;
    headings.forEach((heading, index) => {
      commands.push(text(heading, headerX + 7, 398, 7.2, "1 1 1", true));
      headerX += colWidths[index];
    });
    cursorY = 389;
  };

  beginPage();
  records.forEach((record, recordIndex) => {
    const wrapped = record.map((value, index) =>
      wrapPdfText(
        value,
        Math.max(6, Math.floor((colWidths[index] - 13) / 4.2)),
      ),
    );
    const lineCount = Math.max(...wrapped.map((lines) => lines.length));
    const rowHeight = Math.max(28, lineCount * 9.5 + 12);
    if (cursorY - rowHeight < 47) {
      pages.push(commands);
      beginPage();
    }
    const rowBottom = cursorY - rowHeight;
    if (recordIndex % 2 === 1)
      commands.push(
        rect(left, rowBottom, tableWidth, rowHeight, "0.97 0.99 0.99"),
      );
    commands.push(
      rule(left, rowBottom, left + tableWidth, rowBottom, "0.88 0.91 0.92"),
    );
    let columnX = left;
    record.forEach((value, columnIndex) => {
      const lines = wrapped[columnIndex];
      const baseY = cursorY - 15;
      if (columnIndex === 4 || columnIndex === 5) {
        const isRole = columnIndex === 4;
        const pillWidth = Math.min(
          colWidths[columnIndex] - 10,
          Math.max(35, String(value).length * 4.2 + 15),
        );
        const isActive = value === "Active";
        const pillColor = isRole
          ? value === "Admin"
            ? "0.94 0.92 0.98"
            : value === "Teacher"
              ? "0.89 0.96 0.94"
              : "0.91 0.95 0.99"
          : isActive
            ? "0.89 0.96 0.93"
            : "0.99 0.93 0.90";
        const textColor = isRole
          ? value === "Admin"
            ? "0.34 0.26 0.53"
            : value === "Student"
              ? "0.14 0.39 0.64"
              : "0.06 0.42 0.39"
          : isActive
            ? "0.06 0.42 0.34"
            : "0.66 0.24 0.17";
        commands.push(rect(columnX + 6, baseY - 3, pillWidth, 14, pillColor));
        commands.push(rect(columnX + 10, baseY + 2, 3, 3, textColor));
        commands.push(text(value, columnX + 16, baseY, 6.7, textColor, true));
      } else {
        lines.forEach((line, lineIndex) =>
          commands.push(
            text(
              line,
              columnX + 7,
              baseY - lineIndex * 9.5,
              7.2,
              columnIndex === 0 ? "0.39 0.48 0.59" : "0.20 0.27 0.37",
              columnIndex === 1,
            ),
          ),
        );
      }
      columnX += colWidths[columnIndex];
    });
    cursorY = rowBottom;
  });
  pages.push(commands);

  const objectBodies = [null, null];
  const wrapObject = (id, body) =>
    joinBytes([
      encode(`${id} 0 obj\n`),
      body instanceof Uint8Array ? body : encode(body),
      encode("\nendobj\n"),
    ]);
  const addObject = (body) => {
    const id = objectBodies.length + 1;
    objectBodies.push(wrapObject(id, body));
    return id;
  };
  const regularFontRef = addObject(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  );
  const boldFontRef = addObject(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  );
  const imageHeader = encode(
    `<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logo.bytes.length} >>\nstream\n`,
  );
  objectBodies.push(
    wrapObject(
      logoRef,
      joinBytes([imageHeader, logo.bytes, encode("\nendstream")]),
    ),
  );
  const pageRefs = [];
  pages.forEach((pageCommands, pageIndex) => {
    pageCommands.push(rule(left, 35, left + tableWidth, 35, "0.06 0.46 0.43"));
    pageCommands.push(
      text(
        "VidyaExam  |  Empowering learning, achieving dreams",
        left,
        21,
        7,
        "0.39 0.47 0.57",
      ),
    );
    pageCommands.push(
      text(
        `Page ${pageIndex + 1} of ${pages.length}`,
        left + tableWidth - 70,
        21,
        7,
        "0.39 0.47 0.57",
        true,
      ),
    );
    const streamBytes = encode(pageCommands.join("\n"));
    const contentHeader = encode(
      `<< /Length ${streamBytes.length} >>\nstream\n`,
    );
    const contentRef = addObject(
      joinBytes([contentHeader, streamBytes, encode("\nendstream")]),
    );
    const pageRef = addObject(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} 595] /Resources << /Font << /F1 ${regularFontRef} 0 R /F2 ${boldFontRef} 0 R >> /XObject << /Logo ${logoRef} 0 R >> >> /Contents ${contentRef} 0 R >>`,
    );
    pageRefs.push(pageRef);
  });
  objectBodies[0] = wrapObject(1, "<< /Type /Catalog /Pages 2 0 R >>");
  objectBodies[1] = wrapObject(
    2,
    `<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`,
  );

  const header = encode("%PDF-1.4\n");
  const xrefOffset =
    header.length +
    objectBodies.reduce((total, body) => total + body.length, 0);
  const offsets = [];
  let position = header.length;
  objectBodies.forEach((body) => {
    offsets.push(position);
    position += body.length;
  });
  const xref = `xref\n0 ${objectBodies.length + 1}\n0000000000 65535 f \n${offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objectBodies.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([header, ...objectBodies, encode(xref)], {
    type: "application/pdf",
  });
}

function MemberActionModal({
  mode,
  member,
  tenantId,
  user,
  onClose,
  onCompleted,
}) {
  const isDelete = mode === "delete";
  const [form, setForm] = useState(() => ({
    full_name: member?.full_name || "",
    email: member?.email || "",
    mobile_no: member?.mobile_no || "",
    role_name: String(member?.role_name || "TEACHER").toUpperCase(),
    membership_active: member?.mapping_is_active !== false,
  }));
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const requestLock = useRef(false);
  const formId = useId();
  const name = member?.full_name || "this user";
  const roleOptions = [
    { value: "TEACHER", label: "Teacher" },
    { value: "STUDENT", label: "Student" },
  ];
  const isExistingAdmin =
    String(member?.role_name || "").toUpperCase() === "ADMIN";
  const membershipOptions = [
    { value: "active", label: "Active in organization" },
    { value: "inactive", label: "Inactive in organization" },
  ];
  const closeSafely = () => {
    if (!requestLock.current) onClose();
  };

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError("");
  }

  async function saveChanges(event) {
    event.preventDefault();
    if (requestLock.current) return;
    const fullName = form.full_name.trim();
    const email = form.email.trim();
    const mobile = form.mobile_no.trim();
    let validationMessage = "";
    if (!fullName) validationMessage = "Enter the user's full name.";
    else if (
      !email ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
    )
      validationMessage = "Enter a valid email address.";
    else if (!mobile || !isValidMobile(mobile))
      validationMessage = "Enter a valid 10-digit mobile number.";
    else if (
      !isExistingAdmin &&
      !roleOptions.some((option) => option.value === form.role_name)
    )
      validationMessage = "Choose a valid role.";

    if (validationMessage) {
      setFormError(validationMessage);
      toast.warning("Please review the form.", {
        description: validationMessage,
      });
      return;
    }

    const userId = member?.user_id;
    if (!tenantId || !userId) {
      const message = !tenantId
        ? "No active organization was found. Please sign in again."
        : "This user could not be identified. Refresh the directory and try again.";
      setFormError(message);
      toast.error("Unable to update user.", { description: message });
      return;
    }
    const payload = {};
    if (fullName !== String(member?.full_name || "").trim())
      payload.full_name = fullName;
    if (email !== String(member?.email || "").trim()) payload.email = email;
    if (mobile !== String(member?.mobile_no || "").trim())
      payload.mobile_no = mobile;
    if (form.role_name !== String(member?.role_name || "").toUpperCase())
      payload.role_name = form.role_name;
    if (form.membership_active !== (member?.mapping_is_active !== false))
      payload.is_active = form.membership_active;
    if (Object.keys(payload).length === 0) {
      toast.info("No changes to save.");
      onClose();
      return;
    }

    requestLock.current = true;
    setSubmitting(true);
    try {
      const response = await updateTenantUser(tenantId, userId, payload);
      if (response?.success === false)
        throw Object.assign(
          new Error(response.message || "The user update was not accepted."),
          { response: { data: response } },
        );
      toast.success(response?.message || "User details updated successfully.");
      onCompleted();
      onClose();
    } catch (requestError) {
      const message = tenantMutationError(requestError, "update");
      setFormError(message);
      toast.error("Unable to update user.", { description: message });
    } finally {
      requestLock.current = false;
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (requestLock.current) return;
    const userId = member?.user_id;
    if (!tenantId || !userId) {
      toast.error("Unable to remove user.", {
        description: !tenantId
          ? "No active organization was found. Please sign in again."
          : "This user could not be identified. Refresh the directory and try again.",
      });
      return;
    }
    if (
      String(user?.userId || "") === String(userId) &&
      String(member?.role_name || "").toUpperCase() === "ADMIN"
    ) {
      toast.error("Unable to remove this administrator.", {
        description: "You cannot remove your own administrator membership.",
      });
      return;
    }

    requestLock.current = true;
    setSubmitting(true);
    try {
      const response = await deleteTenantUser(tenantId, userId);
      if (response?.success === false)
        throw Object.assign(
          new Error(response.message || "The user could not be removed."),
          { response: { data: response } },
        );
      toast.success(
        response?.message ||
          "User removed from this organization successfully.",
      );
      onCompleted();
      onClose();
    } catch (requestError) {
      const message = tenantMutationError(requestError, "remove");
      toast.error("Unable to remove user.", { description: message });
    } finally {
      requestLock.current = false;
      setSubmitting(false);
    }
  }

  const footer = isDelete ? (
    <div className="org-member-form-actions">
      <button
        type="button"
        className="org-dashboard-button org-dashboard-button--quiet"
        onClick={closeSafely}
        disabled={submitting}>
        Cancel
      </button>
      <button
        type="button"
        className="org-dashboard-button org-delete-confirm"
        onClick={confirmDelete}
        disabled={submitting}
        aria-busy={submitting}>
        {submitting ? "Deleting…" : "Delete User"}
      </button>
    </div>
  ) : (
    <div className="org-member-form-actions">
      <button
        type="button"
        className="org-dashboard-button org-dashboard-button--quiet"
        onClick={closeSafely}
        disabled={submitting}>
        Cancel
      </button>
      <button
        type="submit"
        form={formId}
        className="org-dashboard-button org-dashboard-button--primary org-member-button--submit"
        disabled={submitting}
        aria-busy={submitting}>
        {submitting ? "Saving changes…" : "Save Changes"}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen
      onClose={closeSafely}
      closeOnEscape={!submitting}
      closeOnOverlay={!submitting}
      title={isDelete ? "Delete User?" : "Edit User"}
      description={
        isDelete
          ? "This will deactivate their access to your organization."
          : "Update this user's details, role, and organization access."
      }
      size={isDelete ? "sm" : "lg"}
      className="org-member-modal org-member-action-modal"
      footer={footer}>
      {isDelete ? (
        <div className="org-member-delete-content">
          <p>
            Are you sure you want to delete <strong>{name}</strong>?
          </p>
          <small>Their account will not be permanently deleted.</small>
        </div>
      ) : (
        <form
          id={formId}
          className="org-member-edit-form"
          onSubmit={saveChanges}
          noValidate>
          <label className="org-member-field">
            <span>
              Full Name <b>*</b>
            </span>
            <input
              autoComplete="name"
              value={form.full_name}
              onChange={(event) => updateField("full_name", event.target.value)}
              aria-invalid={Boolean(formError && !form.full_name.trim())}
              required
            />
          </label>
          <label className="org-member-field">
            <span>
              Email Address <b>*</b>
            </span>
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              aria-invalid={Boolean(
                formError &&
                (!form.email.trim() ||
                  !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())),
              )}
              required
            />
          </label>
          <label className="org-member-field">
            <span>
              Mobile Number <b>*</b>
            </span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={form.mobile_no}
              onChange={(event) =>
                updateField(
                  "mobile_no",
                  event.target.value.replace(/\D/g, "").slice(0, 10),
                )
              }
              aria-invalid={Boolean(
                formError && !isValidMobile(form.mobile_no),
              )}
              required
            />
          </label>
          {isExistingAdmin ? (
            <label className="org-member-field">
              <span>Role</span>
              <input value="Admin" readOnly aria-label="Current role: Admin" />
            </label>
          ) : (
            <label className="org-member-field">
              <span>
                Role <b>*</b>
              </span>
              <MenuSelect
                value={form.role_name}
                options={roleOptions}
                onChange={(value) => updateField("role_name", value)}
                ariaLabel="User role"
                className="org-member-role-select"
              />
            </label>
          )}
          <label className="org-member-field">
            <span>Organization membership</span>
            <MenuSelect
              value={form.membership_active ? "active" : "inactive"}
              options={membershipOptions}
              onChange={(value) =>
                updateField("membership_active", value === "active")
              }
              ariaLabel="Organization membership status"
              className="org-member-role-select"
            />
          </label>
          {formError && (
            <p className="org-member-form-error" role="alert">
              {formError}
            </p>
          )}
        </form>
      )}
    </Modal>
  );
}

function QuotaCard({ label, quota }) {
  const limit = Number(quota?.total_limit),
    created = Number(quota?.created),
    remaining = Number(quota?.remaining);
  const unlimited = limit === -1;
  const knownLimit =
      quota?.total_limit != null &&
      Number.isFinite(limit) &&
      (limit > 0 || unlimited),
    knownCreated =
      quota?.created != null && Number.isFinite(created) && created >= 0,
    knownRemaining =
      quota?.remaining != null &&
      ((Number.isFinite(remaining) && remaining >= 0) ||
        quota.remaining === "UNLIMITED");
  const percent =
    knownLimit && knownCreated && !unlimited
      ? Math.min(100, Math.max(0, (created / limit) * 100))
      : 0;
  const exhausted = knownRemaining && remaining === 0,
    nearLimit =
      knownLimit && knownRemaining && remaining > 0 && remaining / limit <= 0.2;
  return (
    <article
      className={`org-quota-card${exhausted ? " is-exhausted" : nearLimit ? " is-near-limit" : ""}`}>
      <div className="org-quota-top">
        <span>{label} capacity</span>
        <span className="org-quota-state">
          {unlimited
            ? "Unlimited"
            : exhausted
              ? "Full"
              : nearLimit
                ? "Nearly full"
                : "In use"}
        </span>
      </div>
      <strong>
        {knownCreated ? created : "—"}
        <small>
          {" "}
          / {unlimited ? "Unlimited" : knownLimit ? limit : "Not set"}
        </small>
      </strong>
      <div
        className="org-quota-track"
        role="progressbar"
        aria-label={`${label} quota used`}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={percent}>
        <span style={{ width: `${percent}%` }} />
      </div>
      <p>
        {quota?.remaining === "UNLIMITED"
          ? "Unlimited capacity"
          : knownRemaining
            ? `${remaining} remaining`
            : "Remaining capacity unavailable"}
      </p>
    </article>
  );
}

function SummaryCard({ icon: Icon, label, value, detail }) {
  return (
    <article className="org-user-summary">
      <span>
        <Icon size={18} />
      </span>
      <div>
        <p>{label}</p>
        <strong>{value ?? "—"}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}

function RoleDirectoryEmptyState({ view, organizationName }) {
  const isStudent = view === "student";
  const Icon = isStudent ? GraduationCap : BookOpen;
  const label = isStudent ? "students" : "teachers";
  return (
    <div className="org-users-page">
      <PageHeader
        className="org-role-directory-page-header"
        eyebrow="ORGANIZATION WORKSPACE"
        title={isStudent ? "Students" : "Teachers"}
        description={organizationName}
        icon={isStudent ? GraduationCap : BookOpen}
      />
      <section className="org-users-table-panel">
        <div className="org-role-directory-empty" role="status">
          <span>
            <Icon size={25} />
          </span>
          <h2>No {label} to show yet</h2>
          <p>This section is empty for now.</p>
        </div>
      </section>
    </div>
  );
}

function UserDirectory({
  view,
  user,
  onAddMember,
  onReloadReady,
  onQuotaChange,
}) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState(
    view === "teacher" ? "TEACHER" : view === "student" ? "STUDENT" : "ALL",
  );
  const [status, setStatus] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paginationReset, setPaginationReset] = useState(false);
  const [selected, setSelected] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const tenantId = user?.activeTenantId;
  const organizationName = user?.activeTenantName || "Your organization";
  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    onReloadReady(() => reload);
  }, [onReloadReady, reload]);
  useEffect(() => {
    setRole(
      view === "teacher" ? "TEACHER" : view === "student" ? "STUDENT" : "ALL",
    );
  }, [view]);

  useEffect(() => {
    if (!tenantId) {
      setError(
        "No active organization is linked to this account. Please sign in again.",
      );
      setLoading(false);
      return undefined;
    }
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError("");
    getOrganizationUsers({ signal: controller.signal })
      .then((next) => {
        if (active) {
          setResult(next);
          onQuotaChange(next.quota);
          setLoading(false);
        }
      })
      .catch((requestError) => {
        if (!active || requestError?.code === "ERR_CANCELED") return;
        const message =
          requestError?.response?.data?.message ||
          (requestError?.response?.status === 404 ||
          requestError?.response?.status === 405
            ? "The tenant-user list endpoint is not available in the connected backend yet."
            : requestError.message ||
              "Unable to load organization users. Please try again.");
        setError(message);
        setLoading(false);
        toast.error("Unable to load organization users.", {
          description: message,
        });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [tenantId, reloadKey, onQuotaChange]);

  // Until dedicated teacher/student directories are available, only the
  // employee directory displays API records. Keep membership status distinct
  // from the global account status while listing those active memberships.
  const sourceUsers =
    view === "employee"
      ? (result?.data || []).filter(
          (member) => member.mapping_is_active !== false,
        )
      : [];
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const start = startDate
      ? new Date(`${startDate}T00:00:00`).getTime()
      : null;
    const end = endDate ? new Date(`${endDate}T23:59:59.999`).getTime() : null;
    return sourceUsers.filter((member) => {
      const roleValue = String(member.role_name || "").toUpperCase();
      const joined = member.joined_at
        ? new Date(member.joined_at).getTime()
        : null;
      if (role !== "ALL" && roleValue !== role) return false;
      if (status === "ACTIVE" && member.user_is_active !== true) return false;
      if (status === "INACTIVE" && member.user_is_active !== false)
        return false;
      if (
        query &&
        ![member.full_name, member.email, member.mobile_no].some((value) =>
          String(value || "")
            .toLocaleLowerCase()
            .includes(query),
        )
      )
        return false;
      if (start !== null && (joined === null || joined < start)) return false;
      if (end !== null && (joined === null || joined > end)) return false;
      return true;
    });
  }, [sourceUsers, search, role, status, startDate, endDate]);

  useEffect(() => {
    setPaginationReset((value) => !value);
  }, [search, role, status, startDate, endDate]);
  const clearFilters = () => {
    setSearch("");
    setRole("ALL");
    setStatus("ALL");
    setStartDate("");
    setEndDate("");
  };
  const teacherCount = sourceUsers.filter(
    (member) => String(member.role_name).toUpperCase() === "TEACHER",
  ).length;
  const studentCount = sourceUsers.filter(
    (member) => String(member.role_name).toUpperCase() === "STUDENT",
  ).length;
  const quota = result?.quota;

  const columns = useMemo(
    () => [
      {
        name: "User",
        minWidth: "235px",
        grow: 1.5,
        cell: (member) => (
          <div className="org-user-cell">
            <span className="org-user-avatar">
              {initials(member.full_name)}
            </span>
            <span className="org-user-copy">
              <strong>{member.full_name || "Unnamed user"}</strong>
              <small>{member.email || "No email provided"}</small>
            </span>
          </div>
        ),
      },
      {
        name: "Mobile Number",
        selector: (member) => member.mobile_no || "—",
        minWidth: "135px",
      },
      {
        name: "Role",
        cell: (member) => (
          <span
            className={`org-role-badge org-role-badge--${String(member.role_name || "unknown").toLowerCase()}`}>
            {roleLabel(member.role_name)}
          </span>
        ),
        minWidth: "105px",
      },
      {
        name: "Account Status",
        cell: (member) => (
          <span
            className={`org-status-badge ${member.user_is_active === true ? "is-active" : member.user_is_active === false ? "is-inactive" : "is-unknown"}`}>
            <i />
            {member.user_is_active === true
              ? "Active"
              : member.user_is_active === false
                ? "Inactive"
                : "Unknown"}
          </span>
        ),
        minWidth: "130px",
      },
      {
        name: "Joined Date",
        selector: (member) => formatDate(member.joined_at),
        minWidth: "130px",
      },
      {
        name: "Last Login",
        selector: (member) =>
          member.last_login_at
            ? formatDate(member.last_login_at, true)
            : "Never logged in",
        minWidth: "155px",
      },
      {
        name: "Actions",
        button: true,
        minWidth: "92px",
        cell: (member) => (
          <div className="org-user-actions">
            <button
              type="button"
              aria-label={`Edit ${member.full_name || "member"}`}
              title="Edit member"
              onClick={() => {
                setSelected(member);
                setModalMode("edit");
              }}>
              <Pencil size={15} />
            </button>
            <button
              type="button"
              aria-label={`Delete ${member.full_name || "member"}`}
              title="Delete member"
              onClick={() => {
                setSelected(member);
                setModalMode("delete");
              }}>
              <Trash2 size={15} />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  const handleCsv = () => {
    if (!filteredUsers.length) {
      toast.warning("No users match the selected filters.");
      return;
    }
    try {
      exportCsv(filteredUsers);
      toast.success("CSV exported successfully.", {
        description: `${filteredUsers.length} matching ${filteredUsers.length === 1 ? "record" : "records"} included.`,
      });
    } catch (exportError) {
      toast.error("Export failed. Please try again.", {
        description: exportError.message,
      });
    }
  };
  const handlePdf = async () => {
    if (!filteredUsers.length) {
      toast.warning("No users match the selected filters.");
      return;
    }
    const loadingToast = toast.loading("Preparing your VidyaExam PDF report…");
    try {
      const pdf = await buildPdf(
        filteredUsers,
        organizationName,
        role === "ALL" ? "All roles" : roleLabel(role),
        status === "ALL" ? "All statuses" : roleLabel(status),
      );
      downloadBlob(
        pdf,
        `vidyaexam-organization-users-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
      toast.dismiss(loadingToast);
      toast.success("PDF exported successfully.", {
        description: `${filteredUsers.length} matching ${filteredUsers.length === 1 ? "record" : "records"} included.`,
      });
    } catch (exportError) {
      toast.dismiss(loadingToast);
      toast.error("PDF export failed. Please try again.", {
        description: exportError.message,
      });
    }
  };

  const hasUsers = sourceUsers.length > 0;
  return (
    <div className="org-users-page">
      <PageHeader
        className="org-directory-page-header"
        eyebrow="ORGANIZATION WORKSPACE"
        title="Organization Users"
        description="Manage your organization's administrators, teachers, and students in one place."
        icon={Building2}
        meta={<><Building2 size={15} aria-hidden="true" />{organizationName}</>}
        actions={<div className="org-users-page-header-actions">
          <button
            className="org-dashboard-button org-dashboard-button--secondary"
            onClick={handleCsv}>
            <Download size={16} />
            Export CSV
          </button>
          <button
            className="org-dashboard-button org-dashboard-button--secondary"
            onClick={handlePdf}>
            <FileDown size={16} />
            Export PDF
          </button>
          <button
            className="org-dashboard-button org-dashboard-button--primary"
            onClick={() =>
              onAddMember(role === "STUDENT" ? "STUDENT" : "TEACHER")
            }
            disabled={!tenantId}>
            <Plus size={17} />
            Add Member
          </button>
          <button
            className="org-dashboard-button org-dashboard-button--bulk"
            onClick={() => setBulkOpen(true)}
            disabled={!tenantId}>
            <UploadCloud size={17} />
            Add Bulk
          </button>
        </div>}
      />
      <section
        className="org-user-summary-grid"
        aria-label="Organization summary">
        <SummaryCard
          icon={Users}
          label="Total users"
          value={result?.total_users}
          detail="Including administrators"
        />
        <SummaryCard
          icon={BookOpen}
          label="Teachers"
          value={teacherCount}
          detail={
            quota?.teachers
              ? `${quota.teachers.remaining ?? "—"} seats remaining`
              : "Quota unavailable"
          }
        />
        <SummaryCard
          icon={GraduationCap}
          label="Students"
          value={studentCount}
          detail={
            quota?.students
              ? `${quota.students.remaining ?? "—"} seats remaining`
              : "Quota unavailable"
          }
        />
        <SummaryCard
          icon={ShieldCheck}
          label="Current plan"
          value={quota?.plan_name || "—"}
          detail="Organization subscription"
        />
      </section>
      <section className="org-quota-section">
        <div className="org-users-section-title">
          <div>
            <h2>Plan capacity</h2>
            <p>Live usage from your organization subscription.</p>
          </div>
          <span>{quota?.plan_name || "Plan unavailable"}</span>
        </div>
        <div className="org-quota-grid">
          <QuotaCard label="Teacher" quota={quota?.teachers} />
          <QuotaCard label="Student" quota={quota?.students} />
        </div>
      </section>
      <section className="org-users-table-panel">
        <div className="org-users-section-title org-users-table-title">
          <div>
            <h2>
              {view && VIEW_INFO[view]
                ? VIEW_INFO[view].title
                : "Member directory"}
            </h2>
            <p>
              {loading
                ? "Loading organization records…"
                : `${filteredUsers.length} matching ${filteredUsers.length === 1 ? "user" : "users"}`}
            </p>
          </div>
          <span className="org-directory-live">
            <i /> Live directory
          </span>
        </div>
        <div className="org-user-filters">
          <label className="org-search-box">
            <Search size={17} />
            <span className="org-visually-hidden">
              Search name, email, or mobile number
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, mobile…"
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch("")}>
                <X size={15} />
              </button>
            )}
          </label>
          <div className="org-filter-control">
            <MenuSelect
              value={role}
              options={[
                { value: "ALL", label: "All roles" },
                { value: "ADMIN", label: "Admin" },
                { value: "TEACHER", label: "Teacher" },
                { value: "STUDENT", label: "Student" },
              ]}
              onChange={setRole}
              ariaLabel="Filter by role"
            />
          </div>
          <div className="org-filter-control">
            <MenuSelect
              value={status}
              options={[
                { value: "ALL", label: "All statuses" },
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
              ]}
              onChange={setStatus}
              ariaLabel="Filter by account status"
            />
          </div>
          <label className="org-date-control">
            <CalendarDays size={15} />
            <span className="org-visually-hidden">Joined from date</span>
            <input
              aria-label="Joined from"
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>
          <label className="org-date-control">
            <CalendarDays size={15} />
            <span className="org-visually-hidden">Joined to date</span>
            <input
              aria-label="Joined to"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="org-clear-filters"
            onClick={clearFilters}>
            Clear filters
          </button>
        </div>
        {error ? (
          <div className="org-users-state org-users-state--error">
            <span>
              <CircleAlert size={21} />
            </span>
            <h3>Couldn’t load users</h3>
            <p>{error}</p>
            <button
              className="org-dashboard-button org-dashboard-button--secondary"
              onClick={reload}>
              Retry
            </button>
          </div>
        ) : loading && !result ? (
          <BrandLoader
            variant="section"
            message="Loading organization users…"
          />
        ) : (
          <>
            {loading && result && (
              <BrandLoader
                variant="section"
                className="ve-brand-loader--compact"
                message="Refreshing organization users…"
              />
            )}
            {!hasUsers ? (
              <div className="org-users-state">
                <span>
                  {view === "student" ? (
                    <GraduationCap size={22} />
                  ) : view === "teacher" ? (
                    <BookOpen size={22} />
                  ) : (
                    <Users size={22} />
                  )}
                </span>
                <h3>
                  {view === "student"
                    ? "No students yet"
                    : view === "teacher"
                      ? "No teachers yet"
                      : "No organization users yet"}
                </h3>
                <p>
                  {view === "student"
                    ? "Student records will appear here when they are available in this directory."
                    : view === "teacher"
                      ? "Teacher records will appear here when they are available in this directory."
                      : "Add a teacher or student to start building your directory."}
                </p>
                {view === "employee" && (
                  <button
                    className="org-dashboard-button org-dashboard-button--primary"
                    onClick={() => onAddMember("TEACHER")}>
                    <Plus size={16} />
                    Add Member
                  </button>
                )}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="org-users-state">
                <span>
                  <Search size={21} />
                </span>
                <h3>No users match your filters.</h3>
                <p>Try another search or clear the selected filters.</p>
                <button
                  className="org-dashboard-button org-dashboard-button--secondary"
                  onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            ) : (
              <TableShell>
                <DataTable
                  keyField="mapping_id"
                  columns={columns}
                  data={filteredUsers}
                  customStyles={TABLE_STYLES}
                  pagination
                  paginationPerPage={10}
                  paginationRowsPerPageOptions={[5, 10, 20, 50]}
                  paginationResetDefaultPage={paginationReset}
                  paginationComponent={OrganizationPagination}
                  responsive
                  highlightOnHover
                  persistTableHead
                />
              </TableShell>
            )}
          </>
        )}
      </section>
      {modalMode && selected && (
        <MemberActionModal
          key={`${modalMode}-${selected.user_id || selected.mapping_id || "member"}`}
          mode={modalMode}
          member={selected}
          tenantId={tenantId}
          user={user}
          onCompleted={reload}
          onClose={() => {
            setModalMode(null);
            setSelected(null);
          }}
        />
      )}
      {bulkOpen && (
        <BulkMemberModal
          tenantAvailable={Boolean(tenantId)}
          tenantId={tenantId}
          onCompleted={reload}
          onClose={() => setBulkOpen(false)}
        />
      )}
    </div>
  );
}

function TenantDashboardOverview() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    getTenantDashboard({ signal: controller.signal })
      .then(setDashboard)
      .catch((requestError) => {
        if (requestError.name !== "CanceledError" && requestError.name !== "AbortError") {
          setError(requestError.message || "Organization dashboard could not be loaded.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reloadKey]);

  if (loading) return <BrandLoader variant="content" message="Loading organization metrics…" />;
  if (error) return (
    <section className="org-overview-state is-error" role="alert">
      <CircleAlert size={22} aria-hidden="true" />
      <div><h2>Dashboard data unavailable</h2><p>{error}</p></div>
      <button className="org-dashboard-button org-dashboard-button--secondary" type="button" onClick={() => setReloadKey((key) => key + 1)}>
        <RefreshCw size={16} aria-hidden="true" />Retry
      </button>
    </section>
  );

  const overview = dashboard?.overview || {};
  const members = overview.members || {};
  const batches = overview.batches || {};
  const exams = overview.exams || {};
  const questionBank = overview.question_bank || {};
  const performance = overview.performance || {};
  const totalMembers = Number(members.total_students || 0) + Number(members.total_teachers || 0);
  const formatNumber = (value) => Number(value || 0).toLocaleString();
  const metrics = [
    { label: "Members", value: totalMembers, caption: `${formatNumber(members.total_students)} students · ${formatNumber(members.total_teachers)} teachers`, icon: Users, tone: "blue" },
    { label: "Batches / Classes", value: batches.total_batches, caption: `${formatNumber(batches.active_batches)} active batches`, icon: GraduationCap, tone: "teal" },
    { label: "Exams", value: exams.total_exams, caption: `${formatNumber(exams.published_exams)} published · ${formatNumber(exams.draft_exams)} drafts`, icon: CalendarDays, tone: "amber" },
    { label: "Question bank", value: questionBank.total_private_questions, caption: `${formatNumber(questionBank.easy_questions)} easy · ${formatNumber(questionBank.medium_questions)} medium · ${formatNumber(questionBank.hard_questions)} hard`, icon: BookOpen, tone: "violet" },
    { label: "Completed tests", value: performance.completed_tests, caption: `${formatNumber(performance.total_student_attempts)} student attempts`, icon: ShieldCheck, tone: "green" },
    { label: "Currently testing", value: performance.currently_testing, caption: `${formatNumber(exams.upcoming_scheduled_exams)} upcoming scheduled exams`, icon: Users, tone: "teal" },
    { label: "Average score", value: `${Number(performance.avg_student_percentage || 0).toFixed(1)}%`, caption: `${formatNumber(performance.tests_passed)} passed · ${formatNumber(performance.tests_failed)} failed`, icon: BookOpen, tone: "blue" },
    { label: "Pass rate", value: `${Number(performance.pass_rate_percentage || 0).toFixed(1)}%`, caption: `${formatNumber(members.new_members_last_30_days)} new members in 30 days · ${formatNumber(members.inactive_members)} inactive`, icon: ShieldCheck, tone: "green" },
  ];
  const submissions = Array.isArray(dashboard?.recent_submissions) ? dashboard.recent_submissions : [];
  const upcoming = Array.isArray(dashboard?.upcoming_exams) ? dashboard.upcoming_exams : [];

  return (
    <div className="org-overview-content">
      <section className="org-overview-metrics" aria-label="Organization overview">
        {metrics.map(({ label, value, caption, icon: Icon, tone }) => (
          <article className={`org-overview-metric is-${tone}`} key={label}>
            <span className="org-overview-metric__icon"><Icon size={19} aria-hidden="true" /></span>
            <div className="org-overview-metric__copy">
              <span>{label}</span>
              <strong>{typeof value === "number" ? formatNumber(value) : value}</strong>
              <small>{caption}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="org-overview-panels">
        <article className="org-overview-panel">
          <header className="org-overview-panel__header">
            <span className="org-panel-icon"><Users size={18} aria-hidden="true" /></span>
            <div><h2>Recent submissions</h2><p>Latest student exam results.</p></div>
          </header>
          {submissions.length ? (
            <div className="org-overview-submissions">
              {submissions.map((item) => (
                <article className="org-overview-submission" key={item.attempt_id}>
                  <div className="org-overview-submission__main">
                    <strong>{item.student_name || "Student"}</strong>
                    <span>{item.exam_title || "Exam"}</span>
                    <small>{[item.batch_name, item.student_email].filter(Boolean).join(" · ")}</small>
                  </div>
                  <div className="org-overview-submission__score">
                    <strong>{Number(item.score_obtained || 0).toFixed(2)} <small>/ {Number(item.total_marks || 0).toFixed(2)}</small></strong>
                    <span className={item.is_passed ? "is-passed" : "is-failed"}>{item.is_passed ? "Passed" : "Failed"} · {Number(item.percentage || 0).toFixed(1)}%</span>
                    <time dateTime={item.submitted_at}>{formatDate(item.submitted_at, true)}</time>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="org-overview-empty">
              <span><BookOpen size={18} aria-hidden="true" /></span>
              <div><strong>No submissions yet</strong><p>Student results will appear here after they submit an exam.</p></div>
            </div>
          )}
        </article>

        <article className="org-overview-panel">
          <header className="org-overview-panel__header">
            <span className="org-panel-icon"><CalendarDays size={18} aria-hidden="true" /></span>
            <div><h2>Upcoming exams</h2><p>Scheduled assessments for your organization.</p></div>
          </header>
          {upcoming.length ? (
            <div className="org-overview-upcoming">
              {upcoming.map((item) => (
                <article className="org-overview-upcoming__item" key={item.exam_id}>
                  <span className="org-overview-upcoming__date"><CalendarDays size={16} aria-hidden="true" />{formatDate(item.starts_at, true)}</span>
                  <strong>{item.title || "Untitled exam"}</strong>
                  <small>{formatNumber(item.duration_minutes)} min <i /> {Number(item.total_marks || 0).toFixed(2)} marks</small>
                </article>
              ))}
            </div>
          ) : (
            <div className="org-overview-empty">
              <span><CalendarDays size={18} aria-hidden="true" /></span>
              <div><strong>No upcoming exams</strong><p>Scheduled exams will appear here.</p></div>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

export default function OrganizationDashboard() {
  const { user } = useAuthState();
  const { view: routeView, tab: routeTab } = useParams();
  const navigate = useNavigate();
  const [modalRole, setModalRole] = useState(null);
  const [reloadUsers, setReloadUsers] = useState(() => () => {});
  const [quota, setQuota] = useState(null);
  const view = routeView && VIEW_INFO[routeView] ? routeView : null;
  const firstName = (user?.name || "Organization Admin").trim().split(/\s+/)[0];

  return (
    <div className="organization-dashboard">
      <div className="org-dashboard-container">
        {routeView === "settings" ? (
          <UserSettings />
        ) : routeView === "master" ? (
          routeTab === "batches" || !routeTab ? (
            <BatchesPage />
          ) : (
            <MasterWorkspaceSection page={routeTab} />
          )
        ) : routeView === "taxonomy" ? (
          <Suspense
            fallback={
              <BrandLoader variant="content" message="Loading taxonomy…" />
            }>
            <TaxonomySection
              initialTab={routeTab || "categories"}
              taxonomyBasePath={`${ORGANIZATION_DASHBOARD}/taxonomy`}
              showCategories
            />
          </Suspense>
        ) : view === "teacher" || view === "student" ? (
          <RoleDirectoryEmptyState
            view={view}
            organizationName={user?.activeTenantName || "Your organization"}
          />
        ) : view ? (
          <UserDirectory
            view={view}
            user={user}
            onAddMember={setModalRole}
            onReloadReady={setReloadUsers}
            onQuotaChange={setQuota}
          />
        ) : (
          <PageHeader
            className="org-overview-page-header"
            eyebrow="ORGANIZATION WORKSPACE"
            title="Organization Dashboard"
            description={`${user?.activeTenantName ? `${user.activeTenantName} · ` : ""}Manage your organization workspace and member access.`}
            icon={Building2}
            meta={<span>Welcome back, {firstName}.</span>}
            actions={<div className="org-dashboard-page-header-actions">
              <button
                className="org-dashboard-button org-dashboard-button--primary"
                onClick={() => setModalRole("TEACHER")}>
                <Plus size={18} aria-hidden="true" />
                Add Member
              </button>
              <button
                className="org-dashboard-button org-dashboard-button--secondary"
                onClick={() => navigate("/organization/dashboard/employee")}>
                View Employees <Users size={16} aria-hidden="true" />
              </button>
            </div>}
          />
        )}
        {!view && !["taxonomy", "settings", "master"].includes(routeView) && <TenantDashboardOverview />}
      </div>
      {modalRole && (
        <AddMemberModal
          initialRole={modalRole}
          tenantId={user?.activeTenantId}
          tenantAvailable={Boolean(user?.activeTenantId)}
          quota={quota}
          onCreated={async () => {
            if (view) reloadUsers();
            else navigate("/organization/dashboard/employee");
          }}
          onClose={() => setModalRole(null)}
        />
      )}
    </div>
  );
}
