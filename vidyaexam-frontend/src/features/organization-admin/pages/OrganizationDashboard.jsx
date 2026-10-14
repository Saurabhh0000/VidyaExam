import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Building2,
  GraduationCap,
  Plus,
  ShieldCheck,
  Users,
  UserRound,
  UserRoundPlus,
  Eye,
  EyeOff,
  ChevronDown,
  Check,
} from "lucide-react";
import toast from "../../../shared/components/ui/toast";

import { endSession } from "../../auth/state/sessionStore";
import useAuthState from "../../auth/utils/useAuthState";
import { isValidMobile } from "../../auth/utils/registration";
import { createOrganizationMember } from "../services/organization.service";
import Modal from "../../../shared/components/ui/Modal";
import "../styles/organization-dashboard.css";

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

function validateMember(form) {
  const errors = {};
  const fullName = form.full_name.trim();
  const email = form.email.trim();
  if (!fullName) errors.full_name = "Enter the member’s full name.";
  else if (fullName.length < 2) errors.full_name = "Name must contain at least 2 characters.";
  else if (fullName.length > 100) errors.full_name = "Name must be 100 characters or fewer.";
  if (!email) errors.email = "Enter an email address.";
  else if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!form.mobile_no.trim()) errors.mobile_no = "Enter a mobile number.";
  else if (!isValidMobile(form.mobile_no)) {
    errors.mobile_no = "Enter a valid 10-digit Indian mobile number.";
  }
  if (!form.password) errors.password = "Enter a password.";
  else if (form.password.length < 8) {
    errors.password = "Use at least 8 characters for the password.";
  } else if (form.password.length > 128) {
    errors.password = "Password must be 128 characters or fewer.";
  }
  if (!["TEACHER", "STUDENT"].includes(form.role_name)) {
    errors.role_name = "Choose Teacher or Student.";
  }
  return errors;
}

function getRequestError(error) {
  const status = error?.response?.status;
  const backendErrors = error?.response?.data?.errors;
  const backendMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.detail ||
    (Array.isArray(backendErrors) ? backendErrors.join(" ") : "");

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

function AddMemberModal({ initialRole, onClose, tenantAvailable }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, role_name: initialRole });
  const [errors, setErrors] = useState(() =>
    tenantAvailable
      ? {}
      : { form: "No active organization is linked to this account. Sign in with an organization admin account before adding members." },
  );
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const requestInFlight = useRef(false);
  const rolePickerRef = useRef(null);
  const roleTriggerRef = useRef(null);
  const roleOptionsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!roleMenuOpen) return undefined;
    roleOptionsRef.current?.querySelector('[role="option"]')?.focus();
    const onPointerDown = (event) => {
      if (!rolePickerRef.current?.contains(event.target)) setRoleMenuOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setRoleMenuOpen(false);
        roleTriggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [roleMenuOpen]);

  function updateField(event) {
    const { name, value } = event.target;
    const nextValue = name === "mobile_no" ? value.replace(/\D/g, "").slice(0, 10) : value;
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

    if (!tenantAvailable) {
      setErrors((current) => ({ ...current, form: "No active organization is linked to this account. Sign in with an organization admin account before adding members." }));
      return;
    }

    const nextErrors = validateMember(form);
    setTouched({ full_name: true, email: true, mobile_no: true, password: true, role_name: true });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.warning("Review the highlighted fields", {
        description: "Complete each required field with valid information to continue.",
      });
      document.querySelector(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus();
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
      });

      if (result?.success === false) {
        throw new Error(result.message || "The member could not be created.");
      }

      toast.success("Member added successfully", {
        description: `${form.full_name.trim()} can now access your organization.`,
      });
      setForm(EMPTY_FORM);
      onClose();
    } catch (error) {
      const failure = getRequestError(error);
      toast.error(failure.expired ? "Your session has expired" : "Couldn’t add this member", {
        description: failure.message,
      });
      if (failure.expired) {
        endSession();
        navigate("/login", { replace: true });
      } else {
        setErrors((current) => ({ ...current, form: failure.message }));
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
          <span>Full Name <b>*</b></span>
          <input
            name="full_name"
            value={form.full_name}
            onChange={updateField}
            onBlur={validateField}
            autoComplete="name"
            aria-invalid={Boolean(errors.full_name)}
            aria-describedby={errors.full_name ? "org-member-name-error" : undefined}
            required
          />
          {errors.full_name && <small id="org-member-name-error">{errors.full_name}</small>}
        </label>

        <label className="org-member-field">
          <span>Email Address <b>*</b></span>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={updateField}
            onBlur={validateField}
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "org-member-email-error" : undefined}
            required
          />
          {errors.email && <small id="org-member-email-error">{errors.email}</small>}
        </label>

        <label className="org-member-field">
          <span>Mobile Number <b>*</b></span>
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
            aria-describedby={errors.mobile_no ? "org-member-mobile-error" : undefined}
            required
          />
          {errors.mobile_no && <small id="org-member-mobile-error">{errors.mobile_no}</small>}
        </label>

        <label className="org-member-field">
          <span>Password <b>*</b></span>
          <span className="org-member-password">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={updateField}
              onBlur={validateField}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "org-member-password-error" : undefined}
              required
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((current) => !current)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
          {errors.password && <small id="org-member-password-error">{errors.password}</small>}
          <small className="org-member-hint">Use at least 8 characters.</small>
        </label>

        <div className="org-member-field org-member-role-field" ref={rolePickerRef}>
          <span id="org-member-role-label">Role <b>*</b></span>
          <button
            ref={roleTriggerRef}
            type="button"
            name="role_name"
            className="org-member-role-trigger"
            aria-labelledby="org-member-role-label"
            aria-haspopup="listbox"
            aria-expanded={roleMenuOpen}
            aria-invalid={Boolean(errors.role_name)}
            aria-describedby={errors.role_name ? "org-member-role-error" : undefined}
            disabled={submitting}
            onClick={() => setRoleMenuOpen((open) => !open)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                setRoleMenuOpen(true);
              }
            }}>
            <span>{form.role_name === "STUDENT" ? "Student" : "Teacher"}</span>
            <ChevronDown size={18} aria-hidden="true" />
          </button>
          {roleMenuOpen && (
            <div className="org-member-role-options" role="listbox" aria-label="Choose member role" ref={roleOptionsRef}>
              {[{ value: "TEACHER", label: "Teacher" }, { value: "STUDENT", label: "Student" }].map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={form.role_name === option.value}
                  tabIndex={0}
                  disabled={submitting}
                  onClick={() => chooseRole(option.value)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                      event.preventDefault();
                      const options = [...roleOptionsRef.current.querySelectorAll('[role="option"]')];
                      const nextIndex = (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
                      options[nextIndex]?.focus();
                    }
                  }}>
                  <span>{option.label}</span>
                  {form.role_name === option.value && <Check size={17} aria-hidden="true" />}
                </button>
              ))}
            </div>
          )}
          {errors.role_name && <small id="org-member-role-error">{errors.role_name}</small>}
        </div>

        {errors.form && <p className="org-member-form-error" role="alert">{errors.form}</p>}

        <div className="org-member-form-actions">
          <button type="button" className="org-dashboard-button org-dashboard-button--quiet org-member-button--cancel" disabled={submitting} onClick={closeSafely}>
            Cancel
          </button>
          <button type="submit" className="org-dashboard-button org-dashboard-button--primary org-member-button--submit" disabled={submitting || !tenantAvailable} aria-busy={submitting}>
            {submitting ? "Adding member…" : "Add member"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function MetricCard({ Icon, title }) {
  return (
    <article className="org-metric-card">
      <span className="org-metric-icon"><Icon size={19} aria-hidden="true" /></span>
      <span className="org-metric-label">{title}</span>
      <strong className="org-metric-value" aria-label={`${title} unavailable`}>—</strong>
      <span className="org-metric-caption">No reporting data available</span>
    </article>
  );
}

function EmptyDirectory({ view, onAddMember }) {
  const info = VIEW_INFO[view];
  const Icon = view === "teacher" ? BookOpen : view === "student" ? GraduationCap : Users;
  return (
    <section className="org-directory-panel">
      <div className="org-directory-heading">
        <div>
          <span className="org-dashboard-eyebrow">MEMBER DIRECTORY</span>
          <h2>{info.title}</h2>
          <p>{info.description}</p>
        </div>
        <button className="org-dashboard-button org-dashboard-button--primary" onClick={() => onAddMember(view === "student" ? "STUDENT" : "TEACHER")}>
          <Plus size={17} aria-hidden="true" /> Add Member
        </button>
      </div>
      <div className="org-empty-state">
        <span className="org-empty-icon"><Icon size={25} aria-hidden="true" /></span>
        <h3>Member directory isn’t connected yet</h3>
        <p>No {info.singular} records have been loaded. Add a member now, or connect a member-list API to display organization records here.</p>
        <button className="org-dashboard-button org-dashboard-button--secondary" onClick={() => onAddMember(view === "student" ? "STUDENT" : "TEACHER")}>
          <UserRoundPlus size={17} aria-hidden="true" /> Add {info.singular}
        </button>
      </div>
    </section>
  );
}

export default function OrganizationDashboard() {
  const { user } = useAuthState();
  const { view: routeView } = useParams();
  const navigate = useNavigate();
  const [modalRole, setModalRole] = useState(null);
  const view = routeView && VIEW_INFO[routeView] ? routeView : "dashboard";

  useEffect(() => {
    if (routeView && routeView !== view) navigate("/organization/dashboard", { replace: true });
  }, [routeView, view, navigate]);

  const displayName = user?.name || "Organization Admin";
  const firstName = displayName.split(/\s+/)[0];
  const isDirectory = Boolean(VIEW_INFO[view]);

  const shortcuts = useMemo(() => [
    { label: "Add a teacher", text: "Create a teacher account for your team.", Icon: BookOpen, role: "TEACHER" },
    { label: "Add a student", text: "Create a student account in this organization.", Icon: GraduationCap, role: "STUDENT" },
    { label: "Manage members", text: "Open the employee directory view.", Icon: Users, href: "/organization/dashboard/employee" },
  ], []);

  return (
    <div className="organization-dashboard">
      <div className="org-dashboard-container">
        {isDirectory ? (
          <EmptyDirectory view={view} onAddMember={setModalRole} />
        ) : (
          <>
            <section className="org-dashboard-welcome">
              <div className="org-dashboard-welcome-copy">
                <span className="org-dashboard-eyebrow"><Building2 size={14} aria-hidden="true" /> ORGANIZATION WORKSPACE</span>
                <h1>Organization Dashboard</h1>
                <h2>Welcome back, <span>{firstName}</span>.</h2>
                <p>{user?.activeTenantName ? `${user.activeTenantName} · ` : ""}Manage your team, teachers, and students from one place.</p>
              </div>
              <div className="org-dashboard-welcome-actions">
                <button className="org-dashboard-button org-dashboard-button--primary" onClick={() => setModalRole("TEACHER")}>
                  <Plus size={18} aria-hidden="true" /> Add Member
                </button>
                <button className="org-dashboard-button org-dashboard-button--secondary" onClick={() => navigate("/organization/dashboard/employee")}>
                  View Members <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </section>

            <section className="org-metrics-grid" aria-label="Organization member statistics">
              <MetricCard Icon={UserRound} title="Total Employees" />
              <MetricCard Icon={BookOpen} title="Total Teachers" />
              <MetricCard Icon={GraduationCap} title="Total Students" />
              <MetricCard Icon={Users} title="Total Members" />
            </section>

            <section className="org-dashboard-lower-grid">
              <div className="org-info-panel">
                <div className="org-panel-title">
                  <span className="org-panel-icon"><Activity size={18} aria-hidden="true" /></span>
                  <div><h2>Member directory</h2><p>Live member records will appear here when a listing service is available.</p></div>
                </div>
                <div className="org-directory-placeholder">
                  <Users size={20} aria-hidden="true" />
                  <span>No member-list API is configured. No records or totals are being estimated.</span>
                </div>
                <button className="org-text-action" onClick={() => navigate("/organization/dashboard/employee")}>
                  Open directory view <ArrowRight size={15} aria-hidden="true" />
                </button>
              </div>

              <aside className="org-info-panel org-quick-panel">
                <div className="org-panel-title">
                  <span className="org-panel-icon"><ShieldCheck size={18} aria-hidden="true" /></span>
                  <div><h2>Quick actions</h2><p>Common organization tasks.</p></div>
                </div>
                <div className="org-shortcuts">
                  {shortcuts.map(({ label, text, Icon, role, href }) => (
                    <button key={label} className="org-shortcut" onClick={href ? () => navigate(href) : () => setModalRole(role)}>
                      <span className="org-shortcut-icon"><Icon size={18} aria-hidden="true" /></span>
                      <span className="org-shortcut-copy"><strong>{label}</strong><small>{text}</small></span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </aside>
            </section>
          </>
        )}
      </div>

      {modalRole && (
        <AddMemberModal
          initialRole={modalRole}
          tenantAvailable={Boolean(user?.activeTenantId)}
          onClose={() => setModalRole(null)}
        />
      )}
    </div>
  );
}
