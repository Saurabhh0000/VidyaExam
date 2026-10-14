import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
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
  LoaderCircle,
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
import { isValidMobile } from "../../auth/utils/registration";
import { createOrganizationMember, getOrganizationUsers } from "../services/organization.service";
import Modal from "../../../shared/components/ui/Modal";
import "../styles/organization-dashboard.css";

const VIEW_INFO = {
  employee: { title: "Employees", singular: "employee", description: "Review employee access for your organization." },
  teacher: { title: "Teachers", singular: "teacher", description: "Manage teachers who support your learning community." },
  student: { title: "Students", singular: "student", description: "Manage students connected to your organization." },
};

const EMPTY_FORM = {
  full_name: "",
  email: "",
  mobile_no: "",
  password: "",
  role_name: "TEACHER",
};

function MenuSelect({ value, options, onChange, ariaLabel, className = "", placement = "bottom" }) {
  const [open, setOpen] = useState(false);
  const selectId = useId();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const optionsRef = useRef(null);
  const selectedOption = options.find((option) => String(option.value) === String(value)) || options[0];

  useEffect(() => {
    if (!open) return undefined;
    const selected = optionsRef.current?.querySelector('[aria-selected="true"]');
    (selected || optionsRef.current?.querySelector('[role="option"]'))?.focus();
    const closeOutside = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      const buttons = [...(optionsRef.current?.querySelectorAll('[role="option"]') || [])];
      if (!open) {
        event.preventDefault();
        setOpen(true);
        return;
      }
      const currentIndex = buttons.indexOf(document.activeElement);
      const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (currentIndex + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
      event.preventDefault();
      buttons[nextIndex]?.focus();
    }
  }

  function choose(option) {
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  return <div className={`org-menu-select org-menu-select--${placement} ${className}`.trim()} ref={rootRef} onKeyDown={handleKeyDown}>
    <button ref={triggerRef} type="button" className="org-menu-select-trigger" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} aria-controls={selectId} onClick={() => setOpen((current) => !current)}>
      <span>{selectedOption?.label}</span><ChevronDown size={17} aria-hidden="true" />
    </button>
    {open && <div className="org-menu-select-options" id={selectId} role="listbox" aria-label={ariaLabel} ref={optionsRef}>{options.map((option) => <button key={String(option.value)} type="button" role="option" aria-selected={String(option.value) === String(value)} tabIndex={0} onClick={() => choose(option)}>{option.label}{String(option.value) === String(value) && <Check size={16} aria-hidden="true" />}</button>)}</div>}
  </div>;
}

function OrganizationPagination({ rowsPerPage, rowCount, currentPage, onChangePage, onChangeRowsPerPage, paginationRowsPerPageOptions = [] }) {
  const pageCount = Math.max(1, Math.ceil(rowCount / rowsPerPage));
  const firstRow = rowCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const lastRow = Math.min(currentPage * rowsPerPage, rowCount);
  const sizeOptions = paginationRowsPerPageOptions.map((size) => ({ value: size, label: String(size) }));
  const changePage = (page) => onChangePage(Math.min(pageCount, Math.max(1, page)), rowCount);

  return <div className="org-custom-pagination" aria-label="Table pagination">
    <label className="org-page-size-label">Rows per page <MenuSelect value={rowsPerPage} options={sizeOptions} onChange={(size) => onChangeRowsPerPage(Number(size), currentPage)} ariaLabel="Rows per page" placement="top" className="org-page-size-menu" /></label>
    <span className="org-page-range" aria-live="polite">{firstRow}–{lastRow} of {rowCount}</span>
    <div className="org-page-navigation">
      <button type="button" aria-label="First page" disabled={currentPage <= 1} onClick={() => changePage(1)}><ChevronsLeft size={18} /></button>
      <button type="button" aria-label="Previous page" disabled={currentPage <= 1} onClick={() => changePage(currentPage - 1)}><ChevronLeft size={19} /></button>
      <button type="button" aria-label="Next page" disabled={currentPage >= pageCount} onClick={() => changePage(currentPage + 1)}><ChevronRight size={19} /></button>
      <button type="button" aria-label="Last page" disabled={currentPage >= pageCount} onClick={() => changePage(pageCount)}><ChevronsRight size={18} /></button>
    </div>
  </div>;
}

function validateMember(form) {
  const errors = {};
  const fullName = form.full_name.trim();
  const email = form.email.trim();
  if (!fullName) errors.full_name = "Enter the member’s full name.";
  else if (fullName.length < 2) errors.full_name = "Name must contain at least 2 characters.";
  else if (fullName.length > 100) errors.full_name = "Name must be 100 characters or fewer.";
  if (!email) errors.email = "Enter an email address.";
  else if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = "Enter a valid email address.";
  if (!form.mobile_no.trim()) errors.mobile_no = "Enter a mobile number.";
  else if (!isValidMobile(form.mobile_no)) errors.mobile_no = "Enter a valid 10-digit Indian mobile number.";
  if (!form.password) errors.password = "Enter a password.";
  else if (form.password.length < 8) errors.password = "Use at least 8 characters for the password.";
  else if (form.password.length > 128) errors.password = "Password must be 128 characters or fewer.";
  if (!["TEACHER", "STUDENT"].includes(form.role_name)) errors.role_name = "Choose Teacher or Student.";
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
      if (character === '"' && source[index + 1] === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") { row.push(field); field = ""; }
    else if (character === "\n" || character === "\r") {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(field); field = "";
      if (row.some((value) => value.trim())) records.push(row);
      row = [];
    } else field += character;
  }
  if (quoted) throw new Error("The CSV contains an unclosed quoted value.");
  row.push(field);
  if (row.some((value) => value.trim())) records.push(row);
  if (records.length < 2) throw new Error("The CSV needs a header and at least one member row.");

  const normalizeHeader = (header) => {
    const normalized = header.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    return ({ name: "full_name", fullname: "full_name", email_address: "email", mobile: "mobile_no", mobile_number: "mobile_no", phone: "mobile_no", phone_number: "mobile_no", role: "role_name" })[normalized] || normalized;
  };
  const headers = records[0].map(normalizeHeader);
  const required = ["full_name", "email", "mobile_no", "password", "role_name"];
  const missing = required.filter((header) => !headers.includes(header));
  if (missing.length) throw new Error(`Missing CSV columns: ${missing.join(", ")}.`);

  const seenEmails = new Set();
  const seenMobiles = new Set();
  return records.slice(1).map((values, index) => {
    const form = Object.fromEntries(headers.map((header, column) => [header, (values[column] || "").trim()]));
    form.email = String(form.email || "").toLowerCase();
    form.role_name = String(form.role_name || "").toUpperCase();
    const errors = Object.values(validateMember(form));
    const emailKey = form.email.toLowerCase();
    const mobileKey = form.mobile_no;
    if (form.password && new TextEncoder().encode(form.password).length > 72) errors.push("Password must be at most 72 UTF-8 bytes.");
    if (emailKey && seenEmails.has(emailKey)) errors.push("Email is repeated in this CSV.");
    if (mobileKey && seenMobiles.has(mobileKey)) errors.push("Mobile number is repeated in this CSV.");
    if (emailKey) seenEmails.add(emailKey);
    if (mobileKey) seenMobiles.add(mobileKey);
    return { ...form, rowNumber: index + 2, status: errors.length ? "invalid" : "ready", error: errors.join(" ") };
  });
}

function getRequestError(error) {
  const status = error?.response?.status;
  const backendErrors = error?.response?.data?.errors;
  const backendMessage = error?.response?.data?.message || error?.response?.data?.error || error?.response?.data?.detail || (Array.isArray(backendErrors) ? backendErrors.join(" ") : "");
  if (status === 401) return { message: "Your session has expired. Please sign in again.", expired: true };
  if (status === 403) return { message: backendMessage || "You don’t have permission to add organization members." };
  if (status === 409) return { message: backendMessage || "An account with this email or mobile number already exists." };
  if (status === 400 || status === 422) return { message: backendMessage || "Check the member details and try again." };
  if (status === 404 || status === 405) return { message: backendMessage || "Member creation isn’t available from this organization endpoint yet." };
  if (status === 429) return { message: backendMessage || "Too many requests. Wait a moment and try again." };
  if (status >= 500) return { message: backendMessage || "The service is unavailable right now. Please try again later." };
  if (!error?.response) return { message: error?.message || "Unable to connect. Check your connection and try again." };
  return { message: backendMessage || "Unable to add this member. Please try again." };
}

function AddMemberModal({ initialRole, onClose, onCreated, tenantAvailable, quota }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, role_name: initialRole });
  const [errors, setErrors] = useState(() => tenantAvailable ? {} : { form: "No active organization is linked to this account. Sign in with an organization admin account before adding members." });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const requestInFlight = useRef(false);
  const rolePickerRef = useRef(null);
  const roleTriggerRef = useRef(null);
  const roleOptionsRef = useRef(null);
  const navigate = useNavigate();
  const remaining = quota?.[form.role_name === "STUDENT" ? "students" : "teachers"]?.remaining;
  const quotaExhausted = remaining != null && Number.isFinite(Number(remaining)) && Number(remaining) <= 0;

  useEffect(() => {
    if (!roleMenuOpen) return undefined;
    roleOptionsRef.current?.querySelector('[role="option"]')?.focus();
    const onPointerDown = (event) => { if (!rolePickerRef.current?.contains(event.target)) setRoleMenuOpen(false); };
    const onKeyDown = (event) => { if (event.key === "Escape") { setRoleMenuOpen(false); roleTriggerRef.current?.focus(); } };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [roleMenuOpen]);

  function updateField(event) {
    const { name, value } = event.target;
    const nextValue = name === "mobile_no" ? value.replace(/\D/g, "").slice(0, 10) : value;
    const nextForm = { ...form, [name]: nextValue };
    setForm(nextForm);
    setErrors((current) => ({ ...current, [name]: touched[name] ? validateMember(nextForm)[name] || "" : "", form: "" }));
  }

  function validateField(event) {
    const { name } = event.target;
    setTouched((current) => ({ ...current, [name]: true }));
    setErrors((current) => ({ ...current, [name]: validateMember(form)[name] || "" }));
  }

  function chooseRole(roleName) {
    const nextForm = { ...form, role_name: roleName };
    setForm(nextForm);
    setTouched((current) => ({ ...current, role_name: true }));
    setErrors((current) => ({ ...current, role_name: validateMember(nextForm).role_name || "", form: "" }));
    setRoleMenuOpen(false);
    roleTriggerRef.current?.focus();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (requestInFlight.current) return;
    if (!tenantAvailable) { setErrors((current) => ({ ...current, form: "No active organization is linked to this account. Sign in with an organization admin account before adding members." })); return; }
    const nextErrors = validateMember(form);
    setTouched({ full_name: true, email: true, mobile_no: true, password: true, role_name: true });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { toast.warning("Please correct the highlighted fields."); document.querySelector(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus(); return; }
    if (quotaExhausted) { setErrors({ form: `The ${form.role_name.toLowerCase()} quota is exhausted for the current plan.` }); return; }

    requestInFlight.current = true;
    setSubmitting(true);
    try {
      const result = await createOrganizationMember({ full_name: form.full_name.trim(), email: form.email.trim().toLowerCase(), mobile_no: form.mobile_no.trim(), password: form.password, role_name: form.role_name });
      if (result?.success === false) throw new Error(result.message || "The member could not be created.");
      toast.success("Member added successfully.", { description: `${form.full_name.trim()} can now access your organization.` });
      await onCreated();
      onClose();
    } catch (error) {
      const failure = getRequestError(error);
      toast.error(failure.expired ? "Your session has expired" : "Couldn’t add this member", { description: failure.message });
      if (failure.expired) { endSession(); navigate("/login", { replace: true }); }
      else setErrors((current) => ({ ...current, form: failure.message }));
    } finally { requestInFlight.current = false; setSubmitting(false); }
  }

  const closeSafely = () => { if (!submitting) onClose(); };
  return (
    <Modal isOpen onClose={closeSafely} closeOnEscape={!submitting} closeOnOverlay={!submitting} title="Add New Member" description="Create a teacher or student account for your organization." size="lg" className="org-member-modal">
      <form className="org-member-form" onSubmit={handleSubmit} noValidate>
        <label className="org-member-field"><span>Full Name <b>*</b></span><input name="full_name" value={form.full_name} onChange={updateField} onBlur={validateField} autoComplete="name" aria-invalid={Boolean(errors.full_name)} required />{errors.full_name && <small>{errors.full_name}</small>}</label>
        <label className="org-member-field"><span>Email Address <b>*</b></span><input name="email" type="email" value={form.email} onChange={updateField} onBlur={validateField} autoComplete="email" aria-invalid={Boolean(errors.email)} required />{errors.email && <small>{errors.email}</small>}</label>
        <label className="org-member-field"><span>Mobile Number <b>*</b></span><input name="mobile_no" type="tel" inputMode="numeric" maxLength={10} value={form.mobile_no} onChange={updateField} onBlur={validateField} autoComplete="tel-national" aria-invalid={Boolean(errors.mobile_no)} required />{errors.mobile_no && <small>{errors.mobile_no}</small>}</label>
        <label className="org-member-field"><span>Password <b>*</b></span><span className="org-member-password"><input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={updateField} onBlur={validateField} autoComplete="new-password" aria-invalid={Boolean(errors.password)} required /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span>{errors.password && <small>{errors.password}</small>}<small className="org-member-hint">Use at least 8 characters.</small></label>
        <div className="org-member-field org-member-role-field" ref={rolePickerRef}><span id="org-member-role-label">Role <b>*</b></span><button ref={roleTriggerRef} type="button" name="role_name" className="org-member-role-trigger" aria-labelledby="org-member-role-label" aria-haspopup="listbox" aria-expanded={roleMenuOpen} disabled={submitting} onClick={() => setRoleMenuOpen((open) => !open)}><span>{form.role_name === "STUDENT" ? "Student" : "Teacher"}</span><ChevronDown size={18} aria-hidden="true" /></button>{roleMenuOpen && <div className="org-member-role-options" role="listbox" aria-label="Choose member role" ref={roleOptionsRef}>{[{ value: "TEACHER", label: "Teacher" }, { value: "STUDENT", label: "Student" }].map((option) => <button key={option.value} type="button" role="option" aria-selected={form.role_name === option.value} onClick={() => chooseRole(option.value)}><span>{option.label}</span>{form.role_name === option.value && <Check size={17} />}</button>)}</div>}{errors.role_name && <small>{errors.role_name}</small>}</div>
        {quotaExhausted && <p className="org-member-form-error" role="status">The {form.role_name.toLowerCase()} quota is exhausted for the current plan.</p>}
        {errors.form && <p className="org-member-form-error" role="alert">{errors.form}</p>}
        <div className="org-member-form-actions"><button type="button" className="org-dashboard-button org-dashboard-button--quiet org-member-button--cancel" disabled={submitting} onClick={closeSafely}>Cancel</button><button type="submit" className="org-dashboard-button org-dashboard-button--primary org-member-button--submit" disabled={submitting || !tenantAvailable || quotaExhausted} aria-busy={submitting}>{submitting ? "Adding member…" : "Add member"}</button></div>
      </form>
    </Modal>
  );
}

function BulkMemberModal({ onClose, onCompleted, tenantAvailable }) {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);
  const readyCount = rows.filter((row) => row.status === "ready").length;
  const successCount = rows.filter((row) => row.status === "success").length;
  const failedCount = rows.filter((row) => ["invalid", "failed"].includes(row.status)).length;
  const finished = !uploading && processed > 0;

  async function loadFile(file) {
    setFileError("");
    setProcessed(0);
    setRows([]);
    setFileName("");
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) { setFileError("Choose a .csv file to continue."); return; }
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
    if (!tenantAvailable || uploading || !readyCount || fileError) return;
    setUploading(true);
    setProcessed(0);
    const readyRows = rows.filter((row) => row.status === "ready");
    setUploadTotal(readyRows.length);
    let completedCount = 0;
    let succeeded = 0;
    let failed = rows.filter((row) => row.status === "invalid").length;
    for (const row of readyRows) {
      setRows((current) => current.map((item) => item.rowNumber === row.rowNumber ? { ...item, status: "uploading", error: "" } : item));
      try {
        const result = await createOrganizationMember({
          full_name: row.full_name,
          email: row.email,
          mobile_no: row.mobile_no,
          password: row.password,
          role_name: row.role_name,
        });
        if (result?.success === false) throw new Error(result.message || "The server rejected this member.");
        succeeded += 1;
        setRows((current) => current.map((item) => item.rowNumber === row.rowNumber ? { ...item, status: "success", error: "Added" } : item));
      } catch (requestError) {
        const failure = getRequestError(requestError);
        failed += 1;
        setRows((current) => current.map((item) => item.rowNumber === row.rowNumber ? { ...item, status: "failed", error: failure.message } : item));
        if (failure.expired) {
          endSession();
          toast.error("Your session has expired", { description: failure.message });
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
      else if (succeeded) toast.warning("Bulk upload completed with some failures.", { description: `${succeeded} added, ${failed} not added.` });
      else toast.error("No members were added.", { description: `${failed} rows need attention.` });
    }
  }

  function downloadTemplate() {
    const template = "full_name,email,mobile_no,password,role_name\r\n";
    downloadBlob(new Blob(["\uFEFF", template], { type: "text/csv;charset=utf-8" }), "vidyaexam-members-template.csv");
  }

  const closeSafely = () => { if (!uploading) onClose(); };
  return <Modal isOpen onClose={closeSafely} closeOnEscape={!uploading} closeOnOverlay={!uploading} title="Add Members in Bulk" description="Upload a CSV, review each row, then add valid teachers and students to this organization." size="xl" className="org-member-modal org-bulk-modal">
    <div className="org-bulk-template-row"><span><FileSpreadsheet size={17} /> Required columns: full_name, email, mobile_no, password, role_name (TEACHER or STUDENT)</span><button type="button" onClick={downloadTemplate}>Download template</button></div>
    <div className={`org-bulk-dropzone${dragging ? " is-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); loadFile(event.dataTransfer.files?.[0]); }}>
      <span className="org-bulk-upload-icon"><UploadCloud size={23} /></span><strong>{fileName || "Drop your CSV file here"}</strong><small>CSV files only · Passwords are used for account creation and never displayed</small>
      <input ref={fileInputRef} type="file" accept=".csv,text/csv" aria-label="Choose members CSV file" onChange={(event) => { loadFile(event.target.files?.[0]); event.target.value = ""; }} />
      <button type="button" className="org-dashboard-button org-dashboard-button--secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>Choose CSV</button>
    </div>
    {fileError && <p className="org-bulk-file-error" role="alert">{fileError}</p>}
    {!tenantAvailable && <p className="org-bulk-file-error" role="alert">No active organization is linked to this account.</p>}
    {rows.length > 0 && <>
      <div className="org-bulk-summary" aria-live="polite">
        <div><strong>{rows.length}</strong><span>Total rows</span></div><div><strong>{readyCount}</strong><span>Ready to add</span></div><div className="is-success"><strong>{successCount}</strong><span>Added</span></div><div className="is-failed"><strong>{failedCount}</strong><span>Not added</span></div>
      </div>
      {uploading && <div className="org-bulk-progress"><span>Uploading members sequentially… {processed + 1} of {uploadTotal}</span><div><i style={{ width: `${uploadTotal ? (processed / uploadTotal) * 100 : 0}%` }} /></div></div>}
      <div className="org-bulk-table-wrap"><table className="org-bulk-table"><thead><tr><th>CSV row</th><th>Name</th><th>Email</th><th>Mobile</th><th>Role</th><th>Result</th></tr></thead><tbody>{rows.map((row) => <tr key={row.rowNumber}><td>{row.rowNumber}</td><td>{row.full_name || "—"}</td><td>{row.email || "—"}</td><td>{row.mobile_no || "—"}</td><td>{row.role_name === "STUDENT" ? "Student" : row.role_name === "TEACHER" ? "Teacher" : row.role_name || "—"}</td><td><span className={`org-bulk-row-status is-${row.status}`}>{row.status === "ready" ? "Ready" : row.status === "uploading" ? "Adding…" : row.status === "success" ? "Added" : row.status === "invalid" ? row.error : row.error}</span></td></tr>)}</tbody></table></div>
      <p className="org-bulk-security-note">Passwords are not shown in the preview or result table. Only valid rows are submitted.</p>
    </>}
    <div className="org-member-form-actions"><button type="button" className="org-dashboard-button org-dashboard-button--quiet" onClick={closeSafely} disabled={uploading}>{finished ? "Close" : "Cancel"}</button><button type="button" className="org-dashboard-button org-dashboard-button--primary" onClick={uploadRows} disabled={uploading || !readyCount || !tenantAvailable || Boolean(fileError) || finished} aria-busy={uploading}>{uploading ? <><LoaderCircle size={16} />Adding {processed + 1} of {uploadTotal}…</> : finished ? "Upload completed" : `Add ${readyCount || "valid"} members`}</button></div>
  </Modal>;
}

const TableShell = styled.div`
  min-width: 0;
  .rdt_Table { border: 1px solid #e2eae9; border-radius: 13px; overflow: hidden; }
  .rdt_TableHeadRow { border-bottom: 1px solid #e2eae9; }
  .rdt_TableRow { transition: background-color 140ms ease; }
  .rdt_TableRow:hover { background: #f4faf8; }
  .rdt_Pagination { gap: 8px; padding-inline: 12px; color: #64748b; font-family: Inter, Manrope, system-ui, sans-serif; font-size: 13px; }
  .rdt_Pagination select { min-height: 38px; padding: 0 30px 0 11px; color: #172b4d; background-color: #fff; border: 1px solid #dce6e5; border-radius: 9px; font: inherit; }
  .rdt_Pagination button { width: 34px; height: 34px; color: #52637a; border-radius: 8px; transition: color 140ms ease, background-color 140ms ease; }
  .rdt_Pagination button:hover:not(:disabled) { color: #0f766e; background: #e5f5f2; }
  @media (prefers-reduced-motion: reduce) { .rdt_TableRow { transition: none; } }
`;

const TABLE_STYLES = {
  table: { style: { backgroundColor: "#fff" } },
  headRow: { style: { minHeight: "48px", backgroundColor: "#f7faf9", color: "#52637a", fontSize: "12px", fontWeight: 750 } },
  headCells: { style: { paddingLeft: "14px", paddingRight: "14px" } },
  rows: { style: { minHeight: "68px", color: "#172b4d", fontSize: "13px" } },
  cells: { style: { paddingLeft: "14px", paddingRight: "14px" } },
  pagination: { style: { borderTop: "1px solid #e2eae9", color: "#64748b", minHeight: "58px" } },
};

function formatDate(value, includeTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, includeTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(date);
}

function roleLabel(value) { return ({ ADMIN: "Admin", TEACHER: "Teacher", STUDENT: "Student" })[String(value || "").toUpperCase()] || value || "Unknown"; }
function initials(value) { return String(value || "?").trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?"; }

function exportCsv(rows) {
  const columns = ["Full Name", "Email", "Mobile Number", "Role", "Account Status", "Joined Date", "Last Login"];
  const values = rows.map((row) => [row.full_name, row.email, row.mobile_no, roleLabel(row.role_name), row.user_is_active ? "Active" : "Inactive", formatDate(row.joined_at), row.last_login_at ? formatDate(row.last_login_at, true) : "Never logged in"]);
  const csv = [columns, ...values].map((line) => line.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, `vidyaexam-organization-users-${new Date().toISOString().slice(0, 10)}.csv`);
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

function pdfEscape(value) { return String(value ?? "").normalize("NFKD").replace(/[^\x20-\x7E]/g, "?").replace(/([\\()])/g, "\\$1"); }
function wrapPdfText(value, width) {
  const words = String(value ?? "—").split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    let part = word;
    while (part.length > width) { if (line) { lines.push(line); line = ""; } lines.push(part.slice(0, width)); part = part.slice(width); }
    if (!part) return;
    if (line && `${line} ${part}`.length > width) { lines.push(line); line = part; } else line = line ? `${line} ${part}` : part;
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
  if (!context) throw new Error("The organization logo could not be prepared for the report.");
  context.fillStyle = "#172B4D";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0);
  const jpeg = await new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("The organization logo could not be encoded.")), "image/jpeg", 0.96));
  return { bytes: new Uint8Array(await jpeg.arrayBuffer()), width: canvas.width, height: canvas.height };
}

function joinBytes(parts) {
  const size = parts.reduce((total, part) => total + part.length, 0);
  const joined = new Uint8Array(size);
  let offset = 0;
  parts.forEach((part) => { joined.set(part, offset); offset += part.length; });
  return joined;
}

async function buildPdf(rows, organizationName, appliedRole, appliedStatus) {
  const pageWidth = 842;
  const left = 42;
  const colWidths = [28, 110, 155, 83, 74, 81, 102, 123];
  const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
  const headings = ["#", "Name", "Email", "Mobile", "Role", "Status", "Joined", "Last login"];
  const records = rows.map((user, index) => [String(index + 1), user.full_name || "—", user.email || "—", user.mobile_no || "—", roleLabel(user.role_name), user.user_is_active === true ? "Active" : user.user_is_active === false ? "Inactive" : "Unknown", formatDate(user.joined_at), user.last_login_at ? formatDate(user.last_login_at, true) : "Never logged in"]);
  const logo = await loadReportLogo();
  const logoRef = 5;
  const pages = [];
  let commands;
  let cursorY;
  const encode = (value) => new TextEncoder().encode(value);
  const rect = (x, y, width, height, color) => `q ${color} rg ${x} ${y} ${width} ${height} re f Q`;
  const rule = (x1, y1, x2, y2, color = "0.86 0.90 0.91") => `q ${color} RG 0.7 w ${x1} ${y1} m ${x2} ${y2} l S Q`;
  const text = (value, x, y, size = 8, color = "0.20 0.27 0.37", bold = false) => `BT /${bold ? "F2" : "F1"} ${size} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm (${pdfEscape(value)}) Tj ET`;
  const beginPage = () => {
    commands = [];
    commands.push(rect(0, 466, pageWidth, 129, "0.09 0.17 0.30"));
    commands.push(rect(0, 462, pageWidth, 4, "0.06 0.46 0.43"));
    const logoWidth = 190;
    const logoHeight = logoWidth * logo.height / logo.width;
    commands.push(`q ${logoWidth} 0 0 ${logoHeight} 34 511 cm /Logo Do Q`);
    commands.push(text("Organization Users", 252, 553, 19, "1 1 1", true));
    const orgLines = wrapPdfText(organizationName || "Organization", 52);
    commands.push(text(orgLines[0], 253, 531, 10, "0.88 0.94 0.96", true));
    if (orgLines[1]) commands.push(text(orgLines[1], 253, 517, 9, "0.88 0.94 0.96", true));
    commands.push(text(`Created ${new Date().toLocaleString()}`, 253, orgLines[1] ? 499 : 511, 8, "0.73 0.81 0.87"));

    commands.push(rect(left, 420, tableWidth, 29, "0.90 0.96 0.95"));
    const meta = [
      { label: "TOTAL USERS", value: String(rows.length), width: 180 },
      { label: "ROLE FILTER", value: appliedRole, width: 220 },
      { label: "STATUS FILTER", value: appliedStatus, width: tableWidth - 400 },
    ];
    let metaX = left + 11;
    meta.forEach((item, index) => {
      commands.push(rect(metaX, 431, 4, 9, index === 0 ? "0.06 0.46 0.43" : "0.19 0.57 0.54"));
      commands.push(text(item.label, metaX + 9, 439, 6.2, "0.36 0.45 0.54", true));
      commands.push(text(item.value, metaX + 9, 426, 8.5, "0.09 0.17 0.30", true));
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
    const wrapped = record.map((value, index) => wrapPdfText(value, Math.max(6, Math.floor((colWidths[index] - 13) / 4.2))));
    const lineCount = Math.max(...wrapped.map((lines) => lines.length));
    const rowHeight = Math.max(28, lineCount * 9.5 + 12);
    if (cursorY - rowHeight < 47) {
      pages.push(commands);
      beginPage();
    }
    const rowBottom = cursorY - rowHeight;
    if (recordIndex % 2 === 1) commands.push(rect(left, rowBottom, tableWidth, rowHeight, "0.97 0.99 0.99"));
    commands.push(rule(left, rowBottom, left + tableWidth, rowBottom, "0.88 0.91 0.92"));
    let columnX = left;
    record.forEach((value, columnIndex) => {
      const lines = wrapped[columnIndex];
      const baseY = cursorY - 15;
      if (columnIndex === 4 || columnIndex === 5) {
        const isRole = columnIndex === 4;
        const pillWidth = Math.min(colWidths[columnIndex] - 10, Math.max(35, String(value).length * 4.2 + 15));
        const isActive = value === "Active";
        const pillColor = isRole ? (value === "Admin" ? "0.94 0.92 0.98" : value === "Teacher" ? "0.89 0.96 0.94" : "0.91 0.95 0.99") : isActive ? "0.89 0.96 0.93" : "0.99 0.93 0.90";
        const textColor = isRole ? (value === "Admin" ? "0.34 0.26 0.53" : value === "Student" ? "0.14 0.39 0.64" : "0.06 0.42 0.39") : isActive ? "0.06 0.42 0.34" : "0.66 0.24 0.17";
        commands.push(rect(columnX + 6, baseY - 3, pillWidth, 14, pillColor));
        commands.push(rect(columnX + 10, baseY + 2, 3, 3, textColor));
        commands.push(text(value, columnX + 16, baseY, 6.7, textColor, true));
      } else {
        lines.forEach((line, lineIndex) => commands.push(text(line, columnX + 7, baseY - lineIndex * 9.5, 7.2, columnIndex === 0 ? "0.39 0.48 0.59" : "0.20 0.27 0.37", columnIndex === 1)));
      }
      columnX += colWidths[columnIndex];
    });
    cursorY = rowBottom;
  });
  pages.push(commands);

  const objectBodies = [null, null];
  const wrapObject = (id, body) => joinBytes([encode(`${id} 0 obj\n`), body instanceof Uint8Array ? body : encode(body), encode("\nendobj\n")]);
  const addObject = (body) => { const id = objectBodies.length + 1; objectBodies.push(wrapObject(id, body)); return id; };
  const regularFontRef = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const boldFontRef = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const imageHeader = encode(`<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logo.bytes.length} >>\nstream\n`);
  objectBodies.push(wrapObject(logoRef, joinBytes([imageHeader, logo.bytes, encode("\nendstream")])));
  const pageRefs = [];
  pages.forEach((pageCommands, pageIndex) => {
    pageCommands.push(rule(left, 35, left + tableWidth, 35, "0.06 0.46 0.43"));
    pageCommands.push(text("VidyaExam  |  Empowering learning, achieving dreams", left, 21, 7, "0.39 0.47 0.57"));
    pageCommands.push(text(`Page ${pageIndex + 1} of ${pages.length}`, left + tableWidth - 70, 21, 7, "0.39 0.47 0.57", true));
    const streamBytes = encode(pageCommands.join("\n"));
    const contentHeader = encode(`<< /Length ${streamBytes.length} >>\nstream\n`);
    const contentRef = addObject(joinBytes([contentHeader, streamBytes, encode("\nendstream")]));
    const pageRef = addObject(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} 595] /Resources << /Font << /F1 ${regularFontRef} 0 R /F2 ${boldFontRef} 0 R >> /XObject << /Logo ${logoRef} 0 R >> >> /Contents ${contentRef} 0 R >>`);
    pageRefs.push(pageRef);
  });
  objectBodies[0] = wrapObject(1, "<< /Type /Catalog /Pages 2 0 R >>");
  objectBodies[1] = wrapObject(2, `<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`);

  const header = encode("%PDF-1.4\n");
  const xrefOffset = header.length + objectBodies.reduce((total, body) => total + body.length, 0);
  const offsets = [];
  let position = header.length;
  objectBodies.forEach((body) => { offsets.push(position); position += body.length; });
  const xref = `xref\n0 ${objectBodies.length + 1}\n0000000000 65535 f \n${offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objectBodies.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([header, ...objectBodies, encode(xref)], { type: "application/pdf" });
}

function MemberNoticeModal({ mode, member, onClose }) {
  const isDelete = mode === "delete";
  return <Modal isOpen onClose={onClose} title={isDelete ? "Delete Member?" : "Edit Member"} description={isDelete ? "Are you sure you want to delete this member? This action may affect their access to the organization." : "Update the member’s information for this organization."} size="sm" className="org-member-modal">
    <div className="org-unavailable-notice"><CircleAlert size={20} /><p>{isDelete ? "Deletion is unavailable because the connected backend does not expose a tenant-member delete route. The member has not been changed." : "Editing is unavailable because the connected backend does not expose a tenant-member update route. These values are read-only and no changes can be saved."}</p></div>
    <div className="org-member-readonly-grid">
      <label className="org-member-field"><span>Full Name</span><input value={member?.full_name || ""} readOnly /></label>
      <label className="org-member-field"><span>Email Address</span><input value={member?.email || ""} readOnly /></label>
      <label className="org-member-field"><span>Mobile Number</span><input value={member?.mobile_no || ""} readOnly /></label>
      <label className="org-member-field"><span>Role</span><input value={roleLabel(member?.role_name)} readOnly /></label>
    </div>
    <div className="org-member-form-actions"><button type="button" className="org-dashboard-button org-dashboard-button--quiet" onClick={onClose}>{isDelete ? "Cancel" : "Close"}</button>{isDelete && <button type="button" className="org-dashboard-button org-delete-disabled" disabled title="Delete API is not available">Delete Member</button>}{!isDelete && <button type="button" className="org-dashboard-button org-dashboard-button--primary" disabled title="Update API is not available">Save Changes</button>}</div>
  </Modal>;
}

function QuotaCard({ label, quota }) {
  const limit = Number(quota?.total_limit), created = Number(quota?.created), remaining = Number(quota?.remaining);
  const unlimited = limit === -1;
  const knownLimit = quota?.total_limit != null && Number.isFinite(limit) && (limit > 0 || unlimited), knownCreated = quota?.created != null && Number.isFinite(created) && created >= 0, knownRemaining = quota?.remaining != null && (Number.isFinite(remaining) && remaining >= 0 || quota.remaining === "UNLIMITED");
  const percent = knownLimit && knownCreated && !unlimited ? Math.min(100, Math.max(0, (created / limit) * 100)) : 0;
  const exhausted = knownRemaining && remaining === 0, nearLimit = knownLimit && knownRemaining && remaining > 0 && remaining / limit <= 0.2;
  return <article className={`org-quota-card${exhausted ? " is-exhausted" : nearLimit ? " is-near-limit" : ""}`}><div className="org-quota-top"><span>{label} capacity</span><span className="org-quota-state">{unlimited ? "Unlimited" : exhausted ? "Full" : nearLimit ? "Nearly full" : "In use"}</span></div><strong>{knownCreated ? created : "—"}<small> / {unlimited ? "Unlimited" : knownLimit ? limit : "Not set"}</small></strong><div className="org-quota-track" role="progressbar" aria-label={`${label} quota used`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={percent}><span style={{ width: `${percent}%` }} /></div><p>{quota?.remaining === "UNLIMITED" ? "Unlimited capacity" : knownRemaining ? `${remaining} remaining` : "Remaining capacity unavailable"}</p></article>;
}

function SummaryCard({ icon: Icon, label, value, detail }) {
  return <article className="org-user-summary"><span><Icon size={18} /></span><div><p>{label}</p><strong>{value ?? "—"}</strong><small>{detail}</small></div></article>;
}

function UserDirectory({ view, user, onAddMember, onReloadReady, onQuotaChange }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState(view === "teacher" ? "TEACHER" : view === "student" ? "STUDENT" : "ALL");
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

  useEffect(() => { onReloadReady(() => reload); }, [onReloadReady, reload]);
  useEffect(() => { setRole(view === "teacher" ? "TEACHER" : view === "student" ? "STUDENT" : "ALL"); }, [view]);

  useEffect(() => {
    if (!tenantId) { setError("No active organization is linked to this account. Please sign in again."); setLoading(false); return undefined; }
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError("");
    getOrganizationUsers({ signal: controller.signal }).then((next) => { if (active) { setResult(next); onQuotaChange(next.quota); setLoading(false); } }).catch((requestError) => {
      if (!active || requestError?.code === "ERR_CANCELED") return;
      const message = requestError?.response?.data?.message || (requestError?.response?.status === 404 || requestError?.response?.status === 405 ? "The tenant-user list endpoint is not available in the connected backend yet." : requestError.message || "Unable to load organization users. Please try again.");
      setError(message); setLoading(false); toast.error("Unable to load organization users.", { description: message });
    });
    return () => { active = false; controller.abort(); };
  }, [tenantId, reloadKey, onQuotaChange]);

  const sourceUsers = result?.data || [];
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const start = startDate ? new Date(`${startDate}T00:00:00`).getTime() : null;
    const end = endDate ? new Date(`${endDate}T23:59:59.999`).getTime() : null;
    return sourceUsers.filter((member) => {
      const roleValue = String(member.role_name || "").toUpperCase();
      const joined = member.joined_at ? new Date(member.joined_at).getTime() : null;
      if (role !== "ALL" && roleValue !== role) return false;
      if (status === "ACTIVE" && member.user_is_active !== true) return false;
      if (status === "INACTIVE" && member.user_is_active !== false) return false;
      if (query && ![member.full_name, member.email, member.mobile_no].some((value) => String(value || "").toLocaleLowerCase().includes(query))) return false;
      if (start !== null && (joined === null || joined < start)) return false;
      if (end !== null && (joined === null || joined > end)) return false;
      return true;
    });
  }, [sourceUsers, search, role, status, startDate, endDate]);

  useEffect(() => { setPaginationReset((value) => !value); }, [search, role, status, startDate, endDate]);
  const clearFilters = () => { setSearch(""); setRole("ALL"); setStatus("ALL"); setStartDate(""); setEndDate(""); };
  const teacherCount = sourceUsers.filter((member) => String(member.role_name).toUpperCase() === "TEACHER").length;
  const studentCount = sourceUsers.filter((member) => String(member.role_name).toUpperCase() === "STUDENT").length;
  const quota = result?.quota;

  const columns = useMemo(() => [
    { name: "User", minWidth: "235px", grow: 1.5, cell: (member) => <div className="org-user-cell"><span className="org-user-avatar">{initials(member.full_name)}</span><span className="org-user-copy"><strong>{member.full_name || "Unnamed user"}</strong><small>{member.email || "No email provided"}</small></span></div> },
    { name: "Mobile Number", selector: (member) => member.mobile_no || "—", minWidth: "135px" },
    { name: "Role", cell: (member) => <span className={`org-role-badge org-role-badge--${String(member.role_name || "unknown").toLowerCase()}`}>{roleLabel(member.role_name)}</span>, minWidth: "105px" },
    { name: "Account Status", cell: (member) => <span className={`org-status-badge ${member.user_is_active === true ? "is-active" : member.user_is_active === false ? "is-inactive" : "is-unknown"}`}><i />{member.user_is_active === true ? "Active" : member.user_is_active === false ? "Inactive" : "Unknown"}</span>, minWidth: "130px" },
    { name: "Joined Date", selector: (member) => formatDate(member.joined_at), minWidth: "130px" },
    { name: "Last Login", selector: (member) => member.last_login_at ? formatDate(member.last_login_at, true) : "Never logged in", minWidth: "155px" },
    { name: "Actions", button: true, minWidth: "92px", cell: (member) => <div className="org-user-actions"><button type="button" aria-label={`Edit ${member.full_name || "member"}`} title="Edit member" onClick={() => { setSelected(member); setModalMode("edit"); }}><Pencil size={15} /></button><button type="button" aria-label={`Delete ${member.full_name || "member"}`} title="Delete member" onClick={() => { setSelected(member); setModalMode("delete"); }}><Trash2 size={15} /></button></div> },
  ], []);

  const handleCsv = () => {
    if (!filteredUsers.length) { toast.warning("No users match the selected filters."); return; }
    try { exportCsv(filteredUsers); toast.success("CSV exported successfully.", { description: `${filteredUsers.length} matching ${filteredUsers.length === 1 ? "record" : "records"} included.` }); }
    catch (exportError) { toast.error("Export failed. Please try again.", { description: exportError.message }); }
  };
  const handlePdf = async () => {
    if (!filteredUsers.length) { toast.warning("No users match the selected filters."); return; }
    const loadingToast = toast.loading("Preparing your VidyaExam PDF report…");
    try {
      const pdf = await buildPdf(filteredUsers, organizationName, role === "ALL" ? "All roles" : roleLabel(role), status === "ALL" ? "All statuses" : roleLabel(status));
      downloadBlob(pdf, `vidyaexam-organization-users-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.dismiss(loadingToast);
      toast.success("PDF exported successfully.", { description: `${filteredUsers.length} matching ${filteredUsers.length === 1 ? "record" : "records"} included.` });
    } catch (exportError) {
      toast.dismiss(loadingToast);
      toast.error("PDF export failed. Please try again.", { description: exportError.message });
    }
  };

  const hasUsers = sourceUsers.length > 0;
  return <div className="org-users-page">
    <section className="org-users-heading"><div><span className="org-dashboard-eyebrow"><Building2 size={14} /> ORGANIZATION WORKSPACE</span><h1>Organization Users</h1><p>Manage your organization's administrators, teachers, and students in one place.</p><span className="org-users-org-name"><Building2 size={15} />{organizationName}</span></div><div className="org-users-heading-actions"><button className="org-dashboard-button org-dashboard-button--secondary" onClick={handleCsv}><Download size={16} />Export CSV</button><button className="org-dashboard-button org-dashboard-button--secondary" onClick={handlePdf}><FileDown size={16} />Export PDF</button><button className="org-dashboard-button org-dashboard-button--primary" onClick={() => onAddMember(role === "STUDENT" ? "STUDENT" : "TEACHER")} disabled={!tenantId}><Plus size={17} />Add Member</button><button className="org-dashboard-button org-dashboard-button--bulk" onClick={() => setBulkOpen(true)} disabled={!tenantId}><UploadCloud size={17} />Add Bulk</button></div></section>
    <section className="org-user-summary-grid" aria-label="Organization summary"><SummaryCard icon={Users} label="Total users" value={result?.total_users} detail="Including administrators" /><SummaryCard icon={BookOpen} label="Teachers" value={teacherCount} detail={quota?.teachers ? `${quota.teachers.remaining ?? "—"} seats remaining` : "Quota unavailable"} /><SummaryCard icon={GraduationCap} label="Students" value={studentCount} detail={quota?.students ? `${quota.students.remaining ?? "—"} seats remaining` : "Quota unavailable"} /><SummaryCard icon={ShieldCheck} label="Current plan" value={quota?.plan_name || "—"} detail="Organization subscription" />
    </section>
    <section className="org-quota-section"><div className="org-users-section-title"><div><h2>Plan capacity</h2><p>Live usage from your organization subscription.</p></div><span>{quota?.plan_name || "Plan unavailable"}</span></div><div className="org-quota-grid"><QuotaCard label="Teacher" quota={quota?.teachers} /><QuotaCard label="Student" quota={quota?.students} /></div></section>
    <section className="org-users-table-panel"><div className="org-users-section-title org-users-table-title"><div><h2>{view && VIEW_INFO[view] ? VIEW_INFO[view].title : "Member directory"}</h2><p>{loading ? "Loading organization records…" : `${filteredUsers.length} matching ${filteredUsers.length === 1 ? "user" : "users"}`}</p></div><span className="org-directory-live"><i /> Live directory</span></div>
      <div className="org-user-filters">
        <label className="org-search-box"><Search size={17} /><span className="org-visually-hidden">Search name, email, or mobile number</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, mobile…" />{search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")}><X size={15} /></button>}</label>
        <div className="org-filter-control"><MenuSelect value={role} options={[{ value: "ALL", label: "All roles" }, { value: "ADMIN", label: "Admin" }, { value: "TEACHER", label: "Teacher" }, { value: "STUDENT", label: "Student" }]} onChange={setRole} ariaLabel="Filter by role" /></div>
        <div className="org-filter-control"><MenuSelect value={status} options={[{ value: "ALL", label: "All statuses" }, { value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }]} onChange={setStatus} ariaLabel="Filter by account status" /></div>
        <label className="org-date-control"><CalendarDays size={15} /><span className="org-visually-hidden">Joined from date</span><input aria-label="Joined from" type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} /></label>
        <label className="org-date-control"><CalendarDays size={15} /><span className="org-visually-hidden">Joined to date</span><input aria-label="Joined to" type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} /></label>
        <button type="button" className="org-clear-filters" onClick={clearFilters}>Clear filters</button>
      </div>
      {error ? <div className="org-users-state org-users-state--error"><span><CircleAlert size={21} /></span><h3>Couldn’t load users</h3><p>{error}</p><button className="org-dashboard-button org-dashboard-button--secondary" onClick={reload}>Retry</button></div> : loading ? <div className="org-users-loading"><LoaderCircle size={21} /><span>Loading organization users…</span><div className="org-users-skeleton" /></div> : !hasUsers ? <div className="org-users-state"><span><Users size={22} /></span><h3>No organization users yet</h3><p>Add a teacher or student to start building your directory.</p><button className="org-dashboard-button org-dashboard-button--primary" onClick={() => onAddMember("TEACHER")}><Plus size={16} />Add Member</button></div> : filteredUsers.length === 0 ? <div className="org-users-state"><span><Search size={21} /></span><h3>No users match your filters.</h3><p>Try another search or clear the selected filters.</p><button className="org-dashboard-button org-dashboard-button--secondary" onClick={clearFilters}>Clear filters</button></div> : <TableShell><DataTable keyField="mapping_id" columns={columns} data={filteredUsers} customStyles={TABLE_STYLES} pagination paginationPerPage={10} paginationRowsPerPageOptions={[5, 10, 20, 50]} paginationResetDefaultPage={paginationReset} paginationComponent={OrganizationPagination} responsive highlightOnHover persistTableHead /></TableShell>}
    </section>
    {modalMode && <MemberNoticeModal mode={modalMode} member={selected} onClose={() => { setModalMode(null); setSelected(null); }} />}
    {bulkOpen && <BulkMemberModal tenantAvailable={Boolean(tenantId)} onCompleted={reload} onClose={() => setBulkOpen(false)} />}
  </div>;
}

export default function OrganizationDashboard() {
  const { user } = useAuthState();
  const { view: routeView } = useParams();
  const navigate = useNavigate();
  const [modalRole, setModalRole] = useState(null);
  const [reloadUsers, setReloadUsers] = useState(() => () => {});
  const [quota, setQuota] = useState(null);
  const view = routeView && VIEW_INFO[routeView] ? routeView : null;
  const firstName = (user?.name || "Organization Admin").trim().split(/\s+/)[0];

  return <div className="organization-dashboard"><div className="org-dashboard-container">
    {view ? <UserDirectory view={view} user={user} onAddMember={setModalRole} onReloadReady={setReloadUsers} onQuotaChange={setQuota} /> : <section className="org-dashboard-welcome">
      <div className="org-dashboard-welcome-copy">
        <span className="org-dashboard-eyebrow"><Building2 size={14} aria-hidden="true" /> ORGANIZATION WORKSPACE</span>
        <h1>Organization Dashboard</h1>
        <h2>Welcome back, <span>{firstName}</span>.</h2>
        <p>{user?.activeTenantName ? `${user.activeTenantName} · ` : ""}Manage your organization workspace and member access.</p>
      </div>
      <div className="org-dashboard-welcome-actions">
        <button className="org-dashboard-button org-dashboard-button--primary" onClick={() => setModalRole("TEACHER")}><Plus size={18} aria-hidden="true" />Add Member</button>
        <button className="org-dashboard-button org-dashboard-button--secondary" onClick={() => navigate("/organization/dashboard/employee")}>View Employees <Users size={16} aria-hidden="true" /></button>
      </div>
    </section>}
    {!view && <section className="org-dashboard-lower-grid">
      <article className="org-info-panel"><div className="org-panel-title"><span className="org-panel-icon"><Users size={18} aria-hidden="true" /></span><div><h2>Employee directory</h2><p>View organization accounts, subscription capacity, and member activity.</p></div></div><button className="org-text-action" onClick={() => navigate("/organization/dashboard/employee")}>Open employee directory <span aria-hidden="true">→</span></button></article>
      <aside className="org-info-panel org-quick-panel"><div className="org-panel-title"><span className="org-panel-icon"><ShieldCheck size={18} aria-hidden="true" /></span><div><h2>Quick actions</h2><p>Common organization tasks.</p></div></div><div className="org-shortcuts">
        <button className="org-shortcut" onClick={() => setModalRole("TEACHER")}><span className="org-shortcut-icon"><BookOpen size={18} aria-hidden="true" /></span><span className="org-shortcut-copy"><strong>Add a teacher</strong><small>Create a teacher account for your team.</small></span><Plus size={16} aria-hidden="true" /></button>
        <button className="org-shortcut" onClick={() => setModalRole("STUDENT")}><span className="org-shortcut-icon"><GraduationCap size={18} aria-hidden="true" /></span><span className="org-shortcut-copy"><strong>Add a student</strong><small>Create a student account in this organization.</small></span><Plus size={16} aria-hidden="true" /></button>
      </div></aside>
    </section>}
  </div>{modalRole && <AddMemberModal initialRole={modalRole} tenantAvailable={Boolean(user?.activeTenantId)} quota={quota} onCreated={async () => { if (view) reloadUsers(); else navigate("/organization/dashboard/employee"); }} onClose={() => setModalRole(null)} />}</div>;
}
