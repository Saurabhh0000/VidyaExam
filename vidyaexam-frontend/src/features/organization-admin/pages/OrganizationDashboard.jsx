import { useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import { toast } from "sonner";
import {
  FiActivity,
  FiArrowUpRight,
  FiBookOpen,
  FiCheck,
  FiChevronDown,
  FiChevronRight,
  FiGrid,
  FiLayers,
  FiLogOut,
  FiMenu,
  FiPlus,
  FiSearch,
  FiSettings,
  FiShield,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import useAuthState from "../../auth/utils/useAuthState";
import { logout } from "../../auth/services/auth.service";
import { createOrganizationTeacher } from "../services/organization.service";
import "../styles/organization-dashboard.css";

const EMPTY_FORM = {
  full_name: "",
  email: "",
  mobile_no: "",
  password: "",
};

const tableStyles = {
  headCells: {
    style: {
      color: "#64748B",
      fontSize: "12px",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      backgroundColor: "#F8FBFA",
      paddingTop: "16px",
      paddingBottom: "16px",
    },
  },
  cells: {
    style: {
      color: "#172B4D",
      fontSize: "13px",
      paddingTop: "14px",
      paddingBottom: "14px",
    },
  },
  rows: {
    style: {
      minHeight: "64px",
      borderBottom: "1px solid #EAF0EF",
    },
    highlightOnHoverStyle: {
      backgroundColor: "#F6FAF9",
      outline: "none",
    },
  },
};

function StatCard({ icon: Icon, label, value, caption, tone }) {
  return (
    <article className="org-stat-card">
      <div className={`org-stat-icon org-stat-icon--${tone}`}>
        <Icon size={21} />
      </div>

      <p className="org-stat-label">{label}</p>
      <p className="org-stat-value">{value}</p>
      <p className="org-stat-caption">{caption}</p>
    </article>
  );
}

function CreateTeacherModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function validate() {
    const next = {};

    if (!form.full_name.trim()) {
      next.full_name = "Enter the teacher's full name.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Enter a valid email address.";
    }

    if (!/^\d{10}$/.test(form.mobile_no.trim())) {
      next.mobile_no = "Enter a valid 10-digit mobile number.";
    }

    if (form.password.length < 8) {
      next.password = "Password must contain at least 8 characters.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting || !validate()) return;

    setSubmitting(true);

    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        mobile_no: form.mobile_no.trim(),
        password: form.password,
        role_name: "TEACHER",
      };

      const result = await createOrganizationTeacher(payload);

      toast.success(result?.message || "Teacher created successfully.");

      onCreated({
        id: `${Date.now()}`,
        full_name: payload.full_name,
        email: payload.email,
        mobile_no: payload.mobile_no,
        role_name: "TEACHER",
      });

      setForm(EMPTY_FORM);
      onClose();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to create the teacher. Please try again.";

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="org-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onClose();
        }
      }}>
      <section
        className="org-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-teacher-title">
        <header className="org-modal-header">
          <div>
            <span className="org-modal-eyebrow">TEAM MANAGEMENT</span>
            <h2 id="create-teacher-title">Add a teacher</h2>
            <p>Create a teacher account for your organization.</p>
          </div>

          <button
            type="button"
            className="org-icon-button"
            aria-label="Close dialog"
            disabled={submitting}
            onClick={onClose}>
            <FiX size={20} />
          </button>
        </header>

        <form className="org-teacher-form" onSubmit={handleSubmit}>
          <label className="org-field">
            <span>
              Full name <b>*</b>
            </span>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="e.g. Rahul Sharma"
              autoComplete="name"
              required
            />
            {errors.full_name && (
              <small className="org-field-error">{errors.full_name}</small>
            )}
          </label>

          <label className="org-field">
            <span>
              Email address <b>*</b>
            </span>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="teacher@organization.com"
              autoComplete="email"
              required
            />
            {errors.email && (
              <small className="org-field-error">{errors.email}</small>
            )}
          </label>

          <label className="org-field">
            <span>
              Mobile number <b>*</b>
            </span>
            <input
              name="mobile_no"
              type="tel"
              inputMode="numeric"
              value={form.mobile_no}
              onChange={handleChange}
              placeholder="10-digit mobile number"
              autoComplete="tel"
              maxLength={10}
              required
            />
            {errors.mobile_no && (
              <small className="org-field-error">{errors.mobile_no}</small>
            )}
          </label>

          <label className="org-field">
            <span>
              Password <b>*</b>
            </span>
            <div className="org-password-wrap">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="Create a temporary password"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="org-password-toggle"
                onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <small className="org-field-error">{errors.password}</small>
            )}
          </label>

          <div className="org-role-preview">
            <span className="org-role-preview-icon">
              <FiShield size={18} />
            </span>
            <span>
              <strong>Account role</strong>
              <small>Teacher · TEACHER</small>
            </span>
            <FiCheck className="org-role-check" size={19} />
          </div>

          <footer className="org-modal-actions">
            <button
              type="button"
              className="org-btn org-btn-secondary"
              disabled={submitting}
              onClick={onClose}>
              Cancel
            </button>

            <button
              type="submit"
              className="org-btn org-btn-primary"
              disabled={submitting}>
              {submitting ? (
                "Creating..."
              ) : (
                <>
                  <FiPlus size={18} />
                  Create teacher
                </>
              )}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default function OrganizationDashboard() {
  const { user, subscription } = useAuthState();
  const navigate = useNavigate();

  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState("");
  const [teachers, setTeachers] = useState([]);

  const displayName = user?.name || "Organization Admin";

  const filteredTeachers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return teachers;

    return teachers.filter((teacher) =>
      [teacher.full_name, teacher.email, teacher.mobile_no].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [teachers, search]);

  const columns = useMemo(
    () => [
      {
        name: "Teacher",
        selector: (row) => row.full_name,
        sortable: true,
        grow: 1.2,
        cell: (row) => (
          <div className="org-teacher-cell">
            <span className="org-avatar">
              {row.full_name?.charAt(0)?.toUpperCase() || "T"}
            </span>
            <span className="org-teacher-identity">
              <strong>{row.full_name}</strong>
              <small>{row.email}</small>
            </span>
          </div>
        ),
      },
      {
        name: "Mobile",
        selector: (row) => row.mobile_no,
        sortable: true,
        hide: "sm",
      },
      {
        name: "Role",
        selector: (row) => row.role_name,
        cell: () => <span className="org-role-badge">Teacher</span>,
        width: "120px",
      },
    ],
    [],
  );

  const navigation = [
    { label: "Dashboard", icon: FiGrid },
    { label: "Teachers", icon: FiUsers },
    { label: "Students", icon: FiBookOpen },
    { label: "Organization", icon: FiLayers },
    { label: "Settings", icon: FiSettings },
  ];

  async function handleLogout() {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      toast.error("Unable to sign out. Please try again.");
    }
  }

  function selectPage(label) {
    setActivePage(label);
    setSidebarOpen(false);

    if (label !== "Dashboard" && label !== "Teachers") {
      toast("This section is not connected yet.");
    }
  }

  return (
    <div className="org-app">
      {sidebarOpen && (
        <button
          className="org-mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`org-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="org-brand">
          <div className="org-brand-mark">V</div>
          <div className="org-brand-copy">
            <strong>VidyaExam</strong>
            <span>ORGANIZATION</span>
          </div>
          <button
            className="org-icon-button org-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu">
            <FiX size={20} />
          </button>
        </div>

        <div className="org-workspace">
          <span className="org-workspace-icon">
            <FiLayers size={18} />
          </span>
          <span>
            <small>WORKSPACE</small>
            <strong>My organization</strong>
          </span>
          <FiChevronDown size={16} />
        </div>

        <p className="org-nav-label">WORKSPACE</p>

        <nav className="org-navigation" aria-label="Main navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              type="button"
              key={label}
              className={`org-nav-item ${
                activePage === label ? "is-active" : ""
              }`}
              onClick={() => selectPage(label)}>
              <Icon size={19} />
              <span>{label}</span>
              {label === "Teachers" && teachers.length > 0 && (
                <span className="org-nav-count">{teachers.length}</span>
              )}
              {activePage === label && (
                <FiChevronRight className="org-nav-chevron" size={16} />
              )}
            </button>
          ))}
        </nav>

        <div className="org-sidebar-bottom">
          <div className="org-help-card">
            <div className="org-help-icon">
              <FiActivity size={19} />
            </div>
            <strong>Keep learning moving</strong>
            <p>Add your teachers to start building your learning community.</p>
            <button onClick={() => setShowCreateModal(true)}>
              Add a teacher <FiArrowUpRight size={16} />
            </button>
          </div>

          <button className="org-nav-item org-logout" onClick={handleLogout}>
            <FiLogOut size={19} />
            <span>Sign out</span>
          </button>

          <div className="org-sidebar-footer">
            <span className="org-avatar org-avatar--small">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <span className="org-user-meta">
              <strong>{displayName}</strong>
              <small>Organization Admin</small>
            </span>
          </div>
        </div>
      </aside>

      <main className="org-main">
        <header className="org-topbar">
          <div className="org-topbar-left">
            <button
              className="org-icon-button org-menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation">
              <FiMenu size={22} />
            </button>

            <div>
              <div className="org-breadcrumb">
                Workspace <FiChevronRight size={13} /> {activePage}
              </div>
              <h1>{activePage}</h1>
            </div>
          </div>

          <div className="org-topbar-right">
            <span className="org-plan-chip">
              <span />
              {subscription?.planName ||
                subscription?.plan_name ||
                "Organization"}
            </span>

            <button
              className="org-profile-button"
              onClick={handleLogout}
              title="Sign out">
              <span className="org-avatar">
                {displayName.charAt(0).toUpperCase()}
              </span>
              <span className="org-profile-copy">
                <strong>{displayName}</strong>
                <small>Organization Admin</small>
              </span>
              <FiChevronDown size={16} />
            </button>
          </div>
        </header>

        <div className="org-content">
          {activePage === "Dashboard" ? (
            <>
              <section className="org-welcome">
                <div className="org-welcome-copy">
                  <span className="org-eyebrow">
                    <span /> ORGANIZATION OVERVIEW
                  </span>
                  <h2>
                    Welcome back, <span>{displayName.split(" ")[0]}.</span>
                  </h2>
                  <p>
                    A better learning experience starts with a well-organized
                    team. Here's your workspace at a glance.
                  </p>
                </div>

                <button
                  className="org-btn org-btn-primary org-welcome-action"
                  onClick={() => setShowCreateModal(true)}>
                  <FiPlus size={19} />
                  Create teacher
                </button>

                <div className="org-welcome-decoration" aria-hidden="true">
                  <div className="org-deco-ring org-deco-ring-one" />
                  <div className="org-deco-ring org-deco-ring-two" />
                  <FiBookOpen className="org-deco-book" size={72} />
                </div>
              </section>

              <section
                className="org-stats-grid"
                aria-label="Organization statistics">
                <StatCard
                  icon={FiUsers}
                  label="Total teachers"
                  value={teachers.length}
                  caption="Teachers added in this session"
                  tone="teal"
                />
                <StatCard
                  icon={FiBookOpen}
                  label="Total students"
                  value="—"
                  caption="Connect student data to view"
                  tone="blue"
                />
                <StatCard
                  icon={FiLayers}
                  label="Organization users"
                  value="—"
                  caption="Available after user-list API integration"
                  tone="purple"
                />
                <StatCard
                  icon={FiShield}
                  label="Workspace"
                  value="Active"
                  caption="Organization dashboard"
                  tone="gold"
                />
              </section>

              <section className="org-section-grid">
                <article className="org-panel org-teachers-panel">
                  <div className="org-panel-header">
                    <div>
                      <h3>Teachers</h3>
                      <p>Manage the teachers in your organization.</p>
                    </div>

                    <button
                      className="org-btn org-btn-secondary org-view-button"
                      onClick={() => selectPage("Teachers")}>
                      View all <FiArrowUpRight size={16} />
                    </button>
                  </div>

                  <div className="org-table-toolbar">
                    <div className="org-search">
                      <FiSearch size={17} />
                      <input
                        aria-label="Search teachers"
                        placeholder="Search teachers..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                      />
                    </div>

                    <button
                      className="org-btn org-btn-primary"
                      onClick={() => setShowCreateModal(true)}>
                      <FiPlus size={17} /> Add teacher
                    </button>
                  </div>

                  <DataTable
                    columns={columns}
                    data={filteredTeachers}
                    customStyles={tableStyles}
                    pagination
                    paginationPerPage={5}
                    paginationRowsPerPageOptions={[5, 10, 20]}
                    responsive
                    highlightOnHover
                    persistTableHead
                    noDataComponent={
                      <div className="org-empty-state">
                        <span>
                          <FiUsers size={24} />
                        </span>
                        <strong>No teachers to show yet</strong>
                        <p>Create your first teacher account to get started.</p>
                        <button
                          className="org-btn org-btn-secondary"
                          onClick={() => setShowCreateModal(true)}>
                          <FiPlus size={16} /> Create teacher
                        </button>
                      </div>
                    }
                  />
                </article>

                <aside className="org-panel org-quick-panel">
                  <div className="org-panel-header">
                    <div>
                      <h3>Quick actions</h3>
                      <p>Common organization tasks.</p>
                    </div>
                  </div>

                  <button
                    className="org-quick-action"
                    onClick={() => setShowCreateModal(true)}>
                    <span className="org-quick-icon org-quick-icon-teal">
                      <FiUsers size={20} />
                    </span>
                    <span>
                      <strong>Create a teacher</strong>
                      <small>Add a member to your teaching team</small>
                    </span>
                    <FiChevronRight size={18} />
                  </button>

                  <button
                    className="org-quick-action"
                    onClick={() => selectPage("Teachers")}>
                    <span className="org-quick-icon org-quick-icon-blue">
                      <FiLayers size={20} />
                    </span>
                    <span>
                      <strong>Manage teachers</strong>
                      <small>Review teachers created this session</small>
                    </span>
                    <FiChevronRight size={18} />
                  </button>

                  <div className="org-tip-card">
                    <span className="org-tip-icon">
                      <FiShield size={19} />
                    </span>
                    <strong>Keep your workspace organized</strong>
                    <p>
                      Create teacher accounts for your team. Teachers can manage
                      students through their own authorized workflows.
                    </p>
                  </div>
                </aside>
              </section>
            </>
          ) : activePage === "Teachers" ? (
            <section className="org-panel org-full-panel">
              <div className="org-panel-header org-teachers-page-heading">
                <div>
                  <h3>Your teachers</h3>
                  <p>Teachers created from this page session.</p>
                </div>

                <button
                  className="org-btn org-btn-primary"
                  onClick={() => setShowCreateModal(true)}>
                  <FiPlus size={18} /> Create teacher
                </button>
              </div>

              <div className="org-table-toolbar">
                <div className="org-search">
                  <FiSearch size={17} />
                  <input
                    aria-label="Search teachers"
                    placeholder="Search by name, email or mobile"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </div>

              <DataTable
                columns={columns}
                data={filteredTeachers}
                customStyles={tableStyles}
                pagination
                paginationPerPage={10}
                responsive
                highlightOnHover
                noDataComponent={
                  <div className="org-empty-state">
                    <span>
                      <FiUsers size={24} />
                    </span>
                    <strong>No teachers added yet</strong>
                    <p>
                      Your created teachers will appear here during this
                      session.
                    </p>
                  </div>
                }
              />
            </section>
          ) : (
            <section className="org-panel org-coming-soon">
              <span>
                <FiLayers size={28} />
              </span>
              <h2>{activePage}</h2>
              <p>
                This section will be connected when its route and backend API
                are available.
              </p>
              <button
                className="org-btn org-btn-secondary"
                onClick={() => setActivePage("Dashboard")}>
                Back to dashboard
              </button>
            </section>
          )}
        </div>
      </main>

      {showCreateModal && (
        <CreateTeacherModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(teacher) => {
            setTeachers((current) => [teacher, ...current]);
          }}
        />
      )}
    </div>
  );
}
