import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Building2,
  CreditCard,
  GraduationCap,
  Users,
  UserRound,
  ChartNoAxesCombined,
  Settings2,
  ShieldCheck,
  RefreshCw,
  FolderGit2,
  LayoutGrid,
  List,
} from "lucide-react";
import toast from "../../../shared/components/ui/toast";
import useAuthState from "../../auth/utils/useAuthState";
import { SUPER_ADMIN_DASHBOARD } from "../../../app/roleRoutes";
import usePlans from "../../../shared/hooks/usePlans";
import useTenants from "../hooks/useTenants";
import useUsers from "../hooks/useUsers";
import { formatTenantType } from "../utils/tenantFormatters";
import "../styles/super-admin-dashboard.css";

const PlanCatalogTable = lazy(() => import("../components/PlanCatalogTable"));
const TenantsSection = lazy(() => import("../components/TenantsSection"));
const UsersSection = lazy(() => import("../components/UsersSection"));
const TaxonomySection = lazy(() => import("../components/TaxonomySection"));

const SECTIONS = {
  organizations: { title: "Organizations / Tenants", description: "Platform-wide organization directory and tenant administration." },
  users: { title: "Users", description: "Search and manage accounts across VidyaExam." },
  teachers: { title: "Teachers", description: "Platform-wide teacher accounts and organization membership." },
  students: { title: "Students", description: "Platform-wide student accounts and organization membership." },
  subscriptions: { title: "Subscriptions & Plans", description: "View the active individual and tenant plans configured for VidyaExam." },
  taxonomy: { title: "Taxonomy & Curriculum", description: "Manage platform exam categories, curriculum subjects, and syllabus topics." },
  analytics: { title: "Reports & Analytics", description: "Platform activity and growth reporting." },
  settings: { title: "Platform Settings", description: "Platform-level configuration and operational settings." },
};

function MetricCard({ label, Icon, value = "—", stateLabel, isLive = false }) {
  const isLoading = value === "...";
  return (
    <article className="sa-metric-card" aria-label={`${label}: ${isLoading ? "loading" : value}`} aria-busy={isLoading}>
      <span className="sa-metric-icon"><Icon size={20} aria-hidden="true" /></span>
      <span className="sa-metric-label">{label}</span>
      <strong className="sa-metric-value">{isLoading ? "…" : value}</strong>
      <span className="sa-metric-state">
        <span style={isLive ? { background: "#10b981" } : undefined} />
        {stateLabel || "Reporting API unavailable"}
      </span>
    </article>
  );
}

function UnavailableSection({ section }) {
  const info = SECTIONS[section];
  const Icon = section === "analytics" ? ChartNoAxesCombined : Settings2;
  return (
    <section className="sa-content-panel sa-unavailable-panel">
      <span className="sa-empty-icon"><Icon size={24} aria-hidden="true" /></span>
      <p className="sa-eyebrow">PLATFORM WORKSPACE</p>
      <h2>{info.title}</h2>
      <p className="sa-panel-description">{info.description}</p>
      <div className="sa-unavailable-note" role="status">
        <ShieldCheck size={18} aria-hidden="true" />
        <span>This section is ready for platform data, but the backend does not currently provide a Super Admin API for it. No sample records or actions are shown.</span>
      </div>
    </section>
  );
}

function PlansSection() {
  const { status, plans, errorKind, retry } = usePlans();
  const hasNotifiedError = useRef(false);
  const [view, setView] = useState("list");

  useEffect(() => {
    if (status !== "error" || hasNotifiedError.current) return;
    hasNotifiedError.current = true;
    const message = errorKind === "http"
      ? "Unable to load subscription plans. Please try again."
      : errorKind === "timeout"
        ? "Loading plans took too long. Please try again."
        : errorKind === "invalid"
          ? "The subscription plans response could not be read. Please try again."
          : "Unable to connect to subscription plans. Check your connection and try again.";
    toast.error("Unable to load subscription plans", { description: message });
  }, [status, errorKind]);

  if (status === "loading") {
    return (
      <section aria-label="Loading subscription plans" aria-busy="true">
        <p className="sa-loading-message">Loading subscription plans…</p>
      </section>
    );
  }

  if (status === "error") {
    const message = errorKind === "timeout"
      ? "Loading plans took too long. Please try again."
      : errorKind === "http"
        ? "Unable to load subscription plans. Please try again."
        : errorKind === "invalid"
          ? "The subscription plans response could not be read. Please try again."
          : "Unable to connect to subscription plans. Check your connection and try again.";
    return (
      <section className="sa-content-panel sa-plans-error" role="alert">
        <p>{message}</p>
        <button className="sa-button sa-button--secondary" type="button" onClick={() => { hasNotifiedError.current = false; retry(); }}>
          <RefreshCw size={16} aria-hidden="true" /> Try again
        </button>
      </section>
    );
  }

  const { individual, tenant } = plans;
  return (
    <div className="sa-plan-groups">
      <div className="sa-plan-view-toolbar" role="group" aria-label="Plan display style">
        <button type="button" className={`sa-plan-view-button${view === "list" ? " is-active" : ""}`} aria-label="List view" title="List view" aria-pressed={view === "list"} onClick={() => setView("list")}>
          <List size={18} aria-hidden="true" />
        </button>
        <button type="button" className={`sa-plan-view-button${view === "grid" ? " is-active" : ""}`} aria-label="Grid view" title="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")}>
          <LayoutGrid size={18} aria-hidden="true" />
        </button>
      </div>
      {[
        { title: "Individual plans", plans: individual },
        { title: "Organization plans", plans: tenant },
      ].map((group) => (
        <section className="sa-plan-group" key={group.title}>
          <div className="sa-section-heading"><h2>{group.title}</h2><span>{group.plans.length} active {group.plans.length === 1 ? "plan" : "plans"}</span></div>
          {group.plans.length ? (
              <Suspense fallback={<p className="sa-loading-message">Loading plans…</p>}>
              <PlanCatalogTable plans={group.plans} title={group.title} view={view} />
            </Suspense>
          ) : (
            <p className="sa-inline-empty">No active plans in this category.</p>
          )}
        </section>
      ))}
    </div>
  );
}

function Overview({ user }) {
  const today = useMemo(() => new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(new Date()), []);
  const { status: tenantsStatus, tenants, count: tenantsCount } = useTenants();
  const { status: usersStatus, counts: userCounts } = useUsers();

  const activeTenantsCount = useMemo(() => {
    if (!tenants || tenants.length === 0) return 0;
    return tenants.filter((t) => t.isActive).length;
  }, [tenants]);

  const activeSubscriptionsCount = useMemo(() => {
    if (!tenants || tenants.length === 0) return 0;
    return tenants.filter((t) => t.subscriptionStatus === "ACTIVE").length;
  }, [tenants]);

  return (
    <>
      <section className="sa-welcome">
        <div className="sa-welcome-copy">
          <span className="sa-eyebrow"><Activity size={14} aria-hidden="true" /> PLATFORM ADMINISTRATION</span>
          <h1>Super Admin Dashboard</h1>
          <p>Manage organizations, users, subscriptions, and the VidyaExam platform from one place.</p>
          <div className="sa-welcome-meta"><span>Welcome{user?.name ? `, ${user.name}` : ""}</span><span aria-hidden="true">·</span><time>{today}</time></div>
        </div>
        <span className="sa-welcome-mark" aria-hidden="true"><ShieldCheck size={30} /></span>
      </section>

      <section className="sa-metrics-grid" aria-label="Platform overview">
        <MetricCard
          label="Total Organizations"
          Icon={Building2}
          value={tenantsStatus === "ready" ? tenantsCount : tenantsStatus === "loading" ? "..." : "—"}
          stateLabel={
            tenantsStatus === "ready"
              ? `${activeTenantsCount} active`
              : tenantsStatus === "loading"
                ? "Loading organizations..."
                : "Unable to load"
          }
          isLive={tenantsStatus === "ready"}
        />
        <MetricCard
          label="Total Users"
          Icon={Users}
          value={usersStatus === "ready" ? userCounts.total : usersStatus === "loading" ? "..." : "—"}
          stateLabel={
            usersStatus === "ready"
              ? `${userCounts.active} active`
              : usersStatus === "loading"
                ? "Loading users..."
                : "Unable to load"
          }
          isLive={usersStatus === "ready"}
        />
        <MetricCard
          label="Total Teachers"
          Icon={GraduationCap}
          value={usersStatus === "ready" ? userCounts.teachers : usersStatus === "loading" ? "..." : "—"}
          stateLabel={
            usersStatus === "ready"
              ? `${userCounts.teachers} registered`
              : usersStatus === "loading"
                ? "Loading teachers..."
                : "Unable to load"
          }
          isLive={usersStatus === "ready"}
        />
        <MetricCard
          label="Total Students"
          Icon={UserRound}
          value={usersStatus === "ready" ? userCounts.students : usersStatus === "loading" ? "..." : "—"}
          stateLabel={
            usersStatus === "ready"
              ? `${userCounts.students} enrolled`
              : usersStatus === "loading"
                ? "Loading students..."
                : "Unable to load"
          }
          isLive={usersStatus === "ready"}
        />
        <MetricCard
          label="Active Subscriptions"
          Icon={CreditCard}
          value={tenantsStatus === "ready" ? activeSubscriptionsCount : tenantsStatus === "loading" ? "..." : "—"}
          stateLabel={
            tenantsStatus === "ready"
              ? `${activeSubscriptionsCount} active`
              : tenantsStatus === "loading"
                ? "Loading subscriptions..."
                : "Unable to load"
          }
          isLive={tenantsStatus === "ready"}
        />
      </section>

      {/* Registered Organizations summary preview */}
      {tenantsStatus === "ready" && tenants.length > 0 && (
        <section className="sa-content-panel sa-recent-tenants-panel">
          <div className="sa-panel-heading">
            <div>
              <span className="sa-eyebrow">ORGANIZATION DIRECTORY</span>
              <h2>Registered Organizations</h2>
            </div>
            <Link
              className="sa-button sa-button--secondary"
              to={`${SUPER_ADMIN_DASHBOARD}/organizations`}
            >
              View all ({tenants.length}) <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <div className="sa-recent-tenants-list">
            {tenants.slice(0, 4).map((t) => (
              <Link
                key={t.tenantId}
                to={`${SUPER_ADMIN_DASHBOARD}/organizations`}
                className="sa-recent-tenant-card"
              >
                <div className="sa-recent-tenant-left">
                  <div className="sa-recent-avatar">
                    {t.tenantName.charAt(0).toUpperCase()}
                  </div>
                  <div className="sa-recent-tenant-info">
                    <strong>{t.tenantName}</strong>
                    <div className="sa-recent-tenant-meta">
                      <span className="sa-code-badge">{t.tenantCode}</span>
                      <span>{formatTenantType(t.tenantType)}</span>
                      <span>·</span>
                      <span>{t.activeMembersCount} active members</span>
                    </div>
                  </div>
                </div>
                <div className="sa-recent-tenant-right">
                  <span className="sa-plan-badge">{t.planName}</span>
                  <span
                    className={`sa-sub-badge ${
                      t.subscriptionStatus === "ACTIVE" ? "is-active" : "is-inactive"
                    }`}
                  >
                    {t.subscriptionStatus}
                  </span>
                  <ArrowRight size={16} className="sa-recent-arrow" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="sa-content-panel sa-shortcuts">
        <div className="sa-panel-heading">
          <div><span className="sa-eyebrow">QUICK ACCESS</span><h2>Platform workspaces</h2></div>
          <p>Jump to a platform area to manage directory, users, subscriptions, and platform settings.</p>
        </div>
        <div className="sa-shortcut-grid">
          {[
            { title: "Organizations / Tenants", text: "Platform-wide tenant directory", to: `${SUPER_ADMIN_DASHBOARD}/organizations`, Icon: Building2 },
            { title: "Users", text: "Global account administration", to: `${SUPER_ADMIN_DASHBOARD}/users`, Icon: Users },
            { title: "Taxonomy & Curriculum", text: "Categories, subjects & topics", to: `${SUPER_ADMIN_DASHBOARD}/taxonomy`, Icon: FolderGit2 },
            { title: "Teachers", text: "Platform-wide teacher accounts", to: `${SUPER_ADMIN_DASHBOARD}/teachers`, Icon: GraduationCap },
            { title: "Students", text: "Platform-wide student accounts", to: `${SUPER_ADMIN_DASHBOARD}/students`, Icon: UserRound },
            { title: "Subscriptions & Plans", text: "Review configured plans", to: `${SUPER_ADMIN_DASHBOARD}/subscriptions`, Icon: CreditCard },
            { title: "Reports & Analytics", text: "Platform reporting", to: `${SUPER_ADMIN_DASHBOARD}/analytics`, Icon: ChartNoAxesCombined },
          ].map(({ title, text, to, Icon }) => (
            <Link className="sa-shortcut" to={to} key={title}>
              <span className="sa-shortcut-icon"><Icon size={19} aria-hidden="true" /></span>
              <span className="sa-shortcut-copy"><strong>{title}</strong><small>{text}</small></span>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

export default function SuperAdminDashboard() {
  const { section } = useParams();
  const { user } = useAuthState();
  const activeSection = section || "overview";
  const sectionInfo = SECTIONS[activeSection];

  return (
    <div className="super-admin-dashboard">
      <div className="sa-dashboard-container">
        {activeSection === "overview" ? (
          <Overview user={user} />
        ) : sectionInfo ? (
          <>
            <header className="sa-page-heading">
              <p className="sa-eyebrow">SUPER ADMIN WORKSPACE</p>
              <h1>{sectionInfo.title}</h1>
              <p>{sectionInfo.description}</p>
            </header>
            {activeSection === "organizations" ? (
              <Suspense
                fallback={<p className="sa-loading-message">Loading organizations…</p>}
              >
                <TenantsSection />
              </Suspense>
            ) : activeSection === "users" ? (
              <Suspense
                fallback={<p className="sa-loading-message">Loading users…</p>}
              >
                <UsersSection initialRole="ALL" />
              </Suspense>
            ) : activeSection === "taxonomy" ? (
              <Suspense
                fallback={<p className="sa-loading-message">Loading taxonomy…</p>}
              >
                <TaxonomySection />
              </Suspense>
            ) : activeSection === "teachers" ? (
              <Suspense
                fallback={<p className="sa-loading-message">Loading teachers…</p>}
              >
                <UsersSection initialRole="TEACHER" title="Teachers Directory" />
              </Suspense>
            ) : activeSection === "students" ? (
              <Suspense
                fallback={<p className="sa-loading-message">Loading students…</p>}
              >
                <UsersSection initialRole="STUDENT" title="Students Directory" />
              </Suspense>
            ) : activeSection === "subscriptions" ? (
              <PlansSection />
            ) : (
              <UnavailableSection section={activeSection} />
            )}
          </>
        ) : (
          <section className="sa-content-panel sa-unavailable-panel">
            <h1>Dashboard section not found</h1>
            <Link className="sa-button sa-button--primary" to={SUPER_ADMIN_DASHBOARD}>Back to dashboard</Link>
          </section>
        )}
      </div>
    </div>
  );
}
