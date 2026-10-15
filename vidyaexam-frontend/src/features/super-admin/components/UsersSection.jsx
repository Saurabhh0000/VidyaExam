import { useMemo, useState, useEffect, useRef } from "react";
import {
  Users,
  Search,
  X,
  LayoutGrid,
  Table as TableIcon,
  RefreshCw,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  UserCheck,
  Shield,
} from "lucide-react";
import useUsers from "../hooks/useUsers";
import UsersTable from "./UsersTable";
import UsersCards from "./UsersCards";
import UserDetailsModal from "./UserDetailsModal";
import { TenantSelect } from "./TenantControls";
import toast from "../../../shared/components/ui/toast";

export default function UsersSection({ initialRole = "ALL", title }) {
  const { status, users, counts, errorKind, errorMessage, retry, refresh } =
    useUsers();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState(initialRole);
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | ACTIVE | INACTIVE
  const [verificationFilter, setVerificationFilter] = useState("ALL"); // ALL | VERIFIED | UNVERIFIED
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'cards'
  const [selectedUser, setSelectedUser] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync roleFilter when initialRole prop changes (e.g. navigating between Users / Teachers / Students)
  useEffect(() => {
    setRoleFilter(initialRole);
  }, [initialRole]);

  const hasNotifiedError = useRef(false);

  useEffect(() => {
    if (status === "error" && !hasNotifiedError.current) {
      hasNotifiedError.current = true;
      toast.error("Failed to load users", {
        description: errorMessage || "Please check your connection and try again.",
      });
    } else if (status === "ready") {
      hasNotifiedError.current = false;
    }
  }, [status, errorMessage]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const query = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      // Role filter
      if (roleFilter !== "ALL") {
        if (roleFilter === "STUDENT" && user.defaultRole !== "STUDENT") return false;
        if (roleFilter === "TEACHER" && user.defaultRole !== "TEACHER") return false;
        if (roleFilter === "ADMIN" && user.defaultRole !== "ADMIN") return false;
        if (roleFilter === "SUPER_ADMIN" && user.defaultRole !== "SUPER_ADMIN") return false;
        if (roleFilter === "UNASSIGNED" && user.defaultRole && user.defaultRole !== "UNASSIGNED") return false;
      }

      // Status filter
      if (statusFilter === "ACTIVE" && !user.isActive) return false;
      if (statusFilter === "INACTIVE" && user.isActive) return false;

      // Verification filter
      if (verificationFilter === "VERIFIED" && !user.emailVerified) return false;
      if (verificationFilter === "UNVERIFIED" && user.emailVerified) return false;

      // Search query across name, email, mobile, ID, role
      if (query) {
        const matchesName = user.fullName.toLowerCase().includes(query);
        const matchesEmail = user.email.toLowerCase().includes(query);
        const matchesMobile = user.mobileNo ? user.mobileNo.includes(query) : false;
        const matchesId = user.userId.toLowerCase().includes(query);
        const matchesRole = (user.defaultRole || "").toLowerCase().includes(query);

        if (
          !matchesName &&
          !matchesEmail &&
          !matchesMobile &&
          !matchesId &&
          !matchesRole
        ) {
          return false;
        }
      }

      return true;
    });
  }, [users, searchQuery, roleFilter, statusFilter, verificationFilter]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    roleFilter !== initialRole ||
    statusFilter !== "ALL" ||
    verificationFilter !== "ALL";

  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter(initialRole);
    setStatusFilter("ALL");
    setVerificationFilter("ALL");
  };

  const activePercent =
    counts.total > 0 ? Math.round((counts.active / counts.total) * 100) : 0;
  const verifiedPercent =
    counts.total > 0 ? Math.round((counts.verified / counts.total) * 100) : 0;

  return (
    <div className="sa-tenants-section">
      {/* Top Stat Highlights Bar */}
      <section className="sa-tenants-stats-bar" aria-label="User metrics">
        <div className="sa-tenant-stat-card">
          <div className="sa-tstat-icon is-teal">
            <Users size={20} aria-hidden="true" />
          </div>
          <div className="sa-tstat-body">
            <span className="sa-tstat-label">Total Accounts</span>
            <strong className="sa-tstat-value">{counts.total}</strong>
            <span className="sa-tstat-sub">Registered users</span>
          </div>
        </div>

        <div className="sa-tenant-stat-card">
          <div className="sa-tstat-icon is-emerald">
            <UserCheck size={20} aria-hidden="true" />
          </div>
          <div className="sa-tstat-body">
            <span className="sa-tstat-label">Active Users</span>
            <strong className="sa-tstat-value">{counts.active}</strong>
            <span className="sa-tstat-sub sa-tstat-sub--success">
              {activePercent}% active rate
            </span>
          </div>
        </div>

        <div className="sa-tenant-stat-card">
          <div className="sa-tstat-icon is-blue">
            <GraduationCap size={20} aria-hidden="true" />
          </div>
          <div className="sa-tstat-body">
            <span className="sa-tstat-label">Students &amp; Teachers</span>
            <strong className="sa-tstat-value">
              {counts.students} <small style={{ fontSize: "0.85rem", fontWeight: 600 }}>/ {counts.teachers}</small>
            </strong>
            <span className="sa-tstat-sub">
              {counts.students} students · {counts.teachers} teachers
            </span>
          </div>
        </div>

        <div className="sa-tenant-stat-card">
          <div className="sa-tstat-icon is-purple">
            <ShieldCheck size={20} aria-hidden="true" />
          </div>
          <div className="sa-tstat-body">
            <span className="sa-tstat-label">Verified Emails</span>
            <strong className="sa-tstat-value">{counts.verified}</strong>
            <span className="sa-tstat-sub">
              {verifiedPercent}% verified
            </span>
          </div>
        </div>
      </section>

      {/* Main Table / Directory Card */}
      <section className="sa-content-panel sa-tenants-panel">
        {/* Controls Toolbar */}
        <div className="sa-tenants-toolbar">
          <div className="sa-toolbar-left">
            {/* Search Input */}
            <div className="sa-search-wrap">
              <Search size={16} className="sa-search-icon" aria-hidden="true" />
              <input
                type="text"
                className="sa-search-input"
                placeholder="Search by name, email, mobile, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search users"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="sa-search-clear"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Role Tabs */}
            <div className="sa-status-tabs sa-role-tabs" role="tablist" aria-label="Filter by role">
              <button
                type="button"
                role="tab"
                aria-selected={roleFilter === "ALL"}
                className={`sa-tab-btn ${roleFilter === "ALL" ? "is-active" : ""}`}
                onClick={() => setRoleFilter("ALL")}
              >
                All
                <span className="sa-tab-count">{counts.total}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={roleFilter === "STUDENT"}
                className={`sa-tab-btn ${roleFilter === "STUDENT" ? "is-active" : ""}`}
                onClick={() => setRoleFilter("STUDENT")}
              >
                Students
                <span className="sa-tab-count">{counts.students}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={roleFilter === "TEACHER"}
                className={`sa-tab-btn ${roleFilter === "TEACHER" ? "is-active" : ""}`}
                onClick={() => setRoleFilter("TEACHER")}
              >
                Teachers
                <span className="sa-tab-count">{counts.teachers}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={roleFilter === "ADMIN"}
                className={`sa-tab-btn ${roleFilter === "ADMIN" ? "is-active" : ""}`}
                onClick={() => setRoleFilter("ADMIN")}
              >
                Admins
                <span className="sa-tab-count">{counts.admins}</span>
              </button>
            </div>
          </div>

          <div className="sa-toolbar-right">
            {/* Status Filter */}
            <TenantSelect
              value={statusFilter}
              onChange={setStatusFilter}
              label="Filter by account status"
              options={[
                { value: "ALL", label: "All statuses" },
                { value: "ACTIVE", label: "Active users" },
                { value: "INACTIVE", label: "Inactive users" },
              ]}
            />

            {/* Verification Filter */}
            <TenantSelect
              value={verificationFilter}
              onChange={setVerificationFilter}
              label="Filter by email verification"
              options={[
                { value: "ALL", label: "All verification" },
                { value: "VERIFIED", label: "Verified emails" },
                { value: "UNVERIFIED", label: "Unverified emails" },
              ]}
            />

            {/* View Mode Toggle: Table vs Cards */}
            <div className="sa-view-toggle" role="group" aria-label="View layout switcher">
              <button
                type="button"
                className={`sa-toggle-btn ${viewMode === "table" ? "is-active" : ""}`}
                title="Table view"
                aria-label="Table view"
                aria-pressed={viewMode === "table"}
                onClick={() => setViewMode("table")}
              >
                <TableIcon size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`sa-toggle-btn ${viewMode === "cards" ? "is-active" : ""}`}
                title="Cards view"
                aria-label="Cards view"
                aria-pressed={viewMode === "cards"}
                onClick={() => setViewMode("cards")}
              >
                <LayoutGrid size={16} aria-hidden="true" />
              </button>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              className="sa-refresh-btn"
              title="Refresh users"
              aria-label="Refresh users"
              onClick={handleRefresh}
              disabled={status === "loading" || isRefreshing}
            >
              <RefreshCw
                size={16}
                className={isRefreshing || status === "loading" ? "sa-spin" : ""}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {/* Filter Feedback Bar */}
        {hasActiveFilters && (
          <div className="sa-filters-feedback">
            <span>
              Showing <strong>{filteredUsers.length}</strong> of{" "}
              <strong>{counts.total}</strong> accounts
            </span>
            <button
              type="button"
              className="sa-clear-filters-btn"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Content Area */}
        {status === "loading" && (
          <div className="sa-tenants-loading" aria-label="Loading users" aria-busy="true">
            <div className="sa-plan-skeleton" />
            <div className="sa-plan-skeleton" />
            <div className="sa-plan-skeleton" />
          </div>
        )}

        {status === "error" && (
          <div className="sa-tenants-error" role="alert">
            <p>{errorMessage || "Unable to load users directory."}</p>
            <button
              type="button"
              className="sa-button sa-button--secondary"
              onClick={retry}
            >
              <RefreshCw size={15} aria-hidden="true" />
              Try again
            </button>
          </div>
        )}

        {status === "ready" && (
          <>
            {filteredUsers.length === 0 ? (
              <div className="sa-inline-empty sa-tenants-empty">
                <Users size={36} aria-hidden="true" />
                <h3>No users found</h3>
                <p>
                  {hasActiveFilters
                    ? "No users match your current search and filter criteria."
                    : "No user accounts found."}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="sa-btn sa-btn--secondary"
                    onClick={clearFilters}
                  >
                    Reset filters
                  </button>
                )}
              </div>
            ) : viewMode === "table" ? (
              <UsersTable
                users={filteredUsers}
                onSelectUser={(u) => setSelectedUser(u)}
              />
            ) : (
              <UsersCards
                users={filteredUsers}
                onSelectUser={(u) => setSelectedUser(u)}
              />
            )}
          </>
        )}
      </section>

      {/* User Details Modal */}
      <UserDetailsModal
        user={selectedUser}
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}
