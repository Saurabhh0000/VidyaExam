import { useMemo, useState, useEffect, useRef } from "react";
import {
  Building2,
  Search,
  X,
  LayoutGrid,
  Table as TableIcon,
  RefreshCw,
  Users,
  ShieldCheck,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import useTenants from "../hooks/useTenants";
import TenantsTable from "./TenantsTable";
import TenantsCards from "./TenantsCards";
import TenantDetailsModal from "./TenantDetailsModal";
import { TenantSelect } from "./TenantControls";
import toast from "../../../shared/components/ui/toast";
import BrandLoader from "../../../shared/components/ui/BrandLoader";

export default function TenantsSection() {
  const { status, tenants, count, errorKind, errorMessage, retry, refresh } =
    useTenants();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | ACTIVE | INACTIVE
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'cards'
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const hasNotifiedError = useRef(false);

  useEffect(() => {
    if (status === "error" && !hasNotifiedError.current) {
      hasNotifiedError.current = true;
      toast.error("Failed to load organizations", {
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

  // Derive unique types and plans for filter dropdowns
  const availableTypes = useMemo(() => {
    if (!tenants) return [];
    const set = new Set(tenants.map((t) => t.tenantType).filter(Boolean));
    return Array.from(set);
  }, [tenants]);

  const availablePlans = useMemo(() => {
    if (!tenants) return [];
    const set = new Set(tenants.map((t) => t.planName).filter(Boolean));
    return Array.from(set);
  }, [tenants]);

  // Summary Metrics calculated from live data
  const stats = useMemo(() => {
    if (!tenants || tenants.length === 0) {
      return {
        total: 0,
        active: 0,
        totalMembers: 0,
        totalStudentSeats: 0,
        activePercentage: 0,
      };
    }
    const total = tenants.length;
    const active = tenants.filter((t) => t.isActive).length;
    const totalMembers = tenants.reduce(
      (sum, t) => sum + (t.activeMembersCount || 0),
      0
    );
    const totalStudentSeats = tenants.reduce(
      (sum, t) => sum + (t.limits?.students || 0),
      0
    );
    const activePercentage = total > 0 ? Math.round((active / total) * 100) : 0;

    return {
      total,
      active,
      totalMembers,
      totalStudentSeats,
      activePercentage,
    };
  }, [tenants]);

  // Filtered tenants list
  const filteredTenants = useMemo(() => {
    if (!tenants) return [];
    const query = searchQuery.trim().toLowerCase();

    return tenants.filter((tenant) => {
      // Status filter
      if (statusFilter === "ACTIVE" && !tenant.isActive) return false;
      if (statusFilter === "INACTIVE" && tenant.isActive) return false;

      // Type filter
      if (typeFilter !== "ALL" && tenant.tenantType !== typeFilter) return false;

      // Plan filter
      if (planFilter !== "ALL" && tenant.planName !== planFilter) return false;

      // Search query across name, code, email, mobile, type, plan
      if (query) {
        const matchesName = tenant.tenantName.toLowerCase().includes(query);
        const matchesCode = tenant.tenantCode.toLowerCase().includes(query);
        const matchesEmail = tenant.email.toLowerCase().includes(query);
        const matchesMobile = tenant.mobileNo.includes(query);
        const matchesType = tenant.tenantType.toLowerCase().includes(query);
        const matchesPlan = tenant.planName.toLowerCase().includes(query);
        const matchesId = tenant.tenantId.toLowerCase().includes(query);

        if (
          !matchesName &&
          !matchesCode &&
          !matchesEmail &&
          !matchesMobile &&
          !matchesType &&
          !matchesPlan &&
          !matchesId
        ) {
          return false;
        }
      }

      return true;
    });
  }, [tenants, searchQuery, statusFilter, typeFilter, planFilter]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "ALL" ||
    typeFilter !== "ALL" ||
    planFilter !== "ALL";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setPlanFilter("ALL");
  };

  return (
    <div className="sa-tenants-section">
      {/* Top Stat Highlights */}
      <section className="sa-tenants-stats-bar" aria-label="Tenant metrics">
        <div className="sa-tenant-stat-card">
          <div className="sa-tstat-icon is-teal">
            <Building2 size={20} aria-hidden="true" />
          </div>
          <div className="sa-tstat-body">
            <span className="sa-tstat-label">Total Organizations</span>
            <strong className="sa-tstat-value">{stats.total}</strong>
            <span className="sa-tstat-sub">Registered tenants</span>
          </div>
        </div>

        <div className="sa-tenant-stat-card">
          <div className="sa-tstat-icon is-emerald">
            <ShieldCheck size={20} aria-hidden="true" />
          </div>
          <div className="sa-tstat-body">
            <span className="sa-tstat-label">Active Tenants</span>
            <strong className="sa-tstat-value">{stats.active}</strong>
            <span className="sa-tstat-sub sa-tstat-sub--success">
              {stats.activePercentage}% operational
            </span>
          </div>
        </div>

        <div className="sa-tenant-stat-card">
          <div className="sa-tstat-icon is-blue">
            <Users size={20} aria-hidden="true" />
          </div>
          <div className="sa-tstat-body">
            <span className="sa-tstat-label">Total Active Members</span>
            <strong className="sa-tstat-value">{stats.totalMembers}</strong>
            <span className="sa-tstat-sub">Across all institutes</span>
          </div>
        </div>

        <div className="sa-tenant-stat-card">
          <div className="sa-tstat-icon is-purple">
            <GraduationCap size={20} aria-hidden="true" />
          </div>
          <div className="sa-tstat-body">
            <span className="sa-tstat-label">Allocated Student Seats</span>
            <strong className="sa-tstat-value">{stats.totalStudentSeats}</strong>
            <span className="sa-tstat-sub">Total student capacity</span>
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
                placeholder="Search by name, code, email, mobile, plan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search organizations"
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

            {/* Status Tabs */}
            <div className="sa-status-tabs" role="tablist" aria-label="Filter by status">
              <button
                type="button"
                role="tab"
                aria-selected={statusFilter === "ALL"}
                className={`sa-tab-btn ${statusFilter === "ALL" ? "is-active" : ""}`}
                onClick={() => setStatusFilter("ALL")}
              >
                All
                <span className="sa-tab-count">{tenants?.length || 0}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={statusFilter === "ACTIVE"}
                className={`sa-tab-btn ${statusFilter === "ACTIVE" ? "is-active" : ""}`}
                onClick={() => setStatusFilter("ACTIVE")}
              >
                Active
                <span className="sa-tab-count">{stats.active}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={statusFilter === "INACTIVE"}
                className={`sa-tab-btn ${statusFilter === "INACTIVE" ? "is-active" : ""}`}
                onClick={() => setStatusFilter("INACTIVE")}
              >
                Inactive
                <span className="sa-tab-count">{stats.total - stats.active}</span>
              </button>
            </div>
          </div>

          <div className="sa-toolbar-right">
            {/* Filter by Type (if multiple exist) */}
            {availableTypes.length > 1 && (
              <TenantSelect
                value={typeFilter}
                onChange={setTypeFilter}
                label="Filter by organization type"
                options={[
                  { value: "ALL", label: "All organization types" },
                  ...availableTypes.map((type) => ({
                    value: type,
                    label: type.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()),
                  })),
                ]}
              />
            )}

            {/* Filter by Plan (if multiple exist) */}
            {availablePlans.length > 1 && (
              <TenantSelect
                value={planFilter}
                onChange={setPlanFilter}
                label="Filter by subscription plan"
                options={[
                  { value: "ALL", label: "All plans" },
                  ...availablePlans.map((plan) => ({ value: plan, label: `${plan} plan` })),
                ]}
              />
            )}

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
              title="Refresh organizations"
              aria-label="Refresh organizations"
              onClick={handleRefresh}
              disabled={status === "loading" || isRefreshing}
            >
              <RefreshCw
                size={16}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {/* Filter Feedback Bar */}
        {hasActiveFilters && (
          <div className="sa-filters-feedback">
            <span>
              Showing <strong>{filteredTenants.length}</strong> of{" "}
              <strong>{tenants.length}</strong> organizations
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
        {status === "loading" && <BrandLoader variant={tenants.length ? "section" : "content"} className={tenants.length ? "ve-brand-loader--compact" : ""} message={tenants.length ? "Refreshing organizations…" : "Loading organizations…"} />}

        {status === "error" && (
          <div className="sa-tenants-error" role="alert">
            <p>{errorMessage || "Unable to load organizations directory."}</p>
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

        {(status === "ready" || (status === "loading" && tenants.length > 0)) && (
          <>
            {filteredTenants.length === 0 ? (
              <div className="sa-inline-empty sa-tenants-empty">
                <Building2 size={36} aria-hidden="true" />
                <h3>No organizations found</h3>
                <p>
                  {hasActiveFilters
                    ? "No organizations match your current search and filter criteria."
                    : "No organizations have been registered on the platform yet."}
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
              <TenantsTable
                tenants={filteredTenants}
                onSelectTenant={(t) => setSelectedTenant(t)}
              />
            ) : (
              <TenantsCards
                tenants={filteredTenants}
                onSelectTenant={(t) => setSelectedTenant(t)}
              />
            )}
          </>
        )}
      </section>

      {/* Tenant Details Modal */}
      <TenantDetailsModal
        tenant={selectedTenant}
        isOpen={Boolean(selectedTenant)}
        onClose={() => setSelectedTenant(null)}
      />
    </div>
  );
}
