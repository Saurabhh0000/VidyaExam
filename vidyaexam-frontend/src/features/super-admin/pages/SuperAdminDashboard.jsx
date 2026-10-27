import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  BookOpen,
  CalendarDays,
  CircleAlert,
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
import BrandLoader from "../../../shared/components/ui/BrandLoader";
import MasterWorkspaceSection from "../../../shared/components/MasterWorkspaceSection";
import BatchesPage from "../../batches/pages/BatchesPage";
import useAuthState from "../../auth/utils/useAuthState";
import { SUPER_ADMIN_DASHBOARD } from "../../../app/roleRoutes";
import usePlans from "../../../shared/hooks/usePlans";
import { getSuperAdminDashboard } from "../services/super-admin-dashboard.service";
import PageHeader from "../../../shared/components/ui/PageHeader";
import "../styles/super-admin-dashboard.css";

const PlanCatalogTable = lazy(() => import("../components/PlanCatalogTable"));
const TenantsSection = lazy(() => import("../components/TenantsSection"));
const UsersSection = lazy(() => import("../components/UsersSection"));
const TaxonomySection = lazy(() => import("../components/TaxonomySection"));
const QuestionBankPage = lazy(() => import("../../question-bank/pages/QuestionBankPage"));

const SECTIONS = {
  organizations: { title: "Organizations / Tenants", description: "Platform-wide organization directory and tenant administration." },
  users: { title: "Users", description: "Search and manage accounts across VidyaExam." },
  teachers: { title: "Teachers", description: "Platform-wide teacher accounts and organization membership." },
  students: { title: "Students", description: "Platform-wide student accounts and organization membership." },
  subscriptions: { title: "Subscriptions & Plans", description: "View the active individual and tenant plans configured for VidyaExam." },
  taxonomy: { title: "Taxonomy & Curriculum", description: "Manage platform exam categories, curriculum subjects, and syllabus topics." },
  master: { title: "Master", description: "Manage batches, exams, and sections." },
  analytics: { title: "Reports & Analytics", description: "Platform activity and growth reporting." },
  settings: { title: "Platform Settings", description: "Platform-level configuration and operational settings." },
  questions: { title: "Question Bank", description: "Create, organize, and review platform and tenant questions." },
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
        <BrandLoader variant="content" message="Loading subscription plans…" />
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
              <Suspense fallback={<BrandLoader variant="section" message="Loading plans…" />}>
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
  const [dashboard, setDashboard] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setError("");
    getSuperAdminDashboard({ signal: controller.signal })
      .then((result) => {
        setDashboard(result);
        setStatus("ready");
      })
      .catch((requestError) => {
        if (requestError.name === "CanceledError" || requestError.name === "AbortError") return;
        setError(requestError.message || "Platform dashboard could not be loaded.");
        setStatus("error");
      });
    return () => controller.abort();
  }, [reloadKey]);

  const overview = dashboard?.overview || {};
  const tenants = overview.tenants || {};
  const users = overview.users || {};
  const exams = overview.exams || {};
  const questions = overview.questions || {};
  const activity = overview.testing_activity || {};
  const formatNumber = (value) => Number(value || 0).toLocaleString();
  const recentTenants = Array.isArray(dashboard?.recent_tenants) ? dashboard.recent_tenants : [];
  const submissions = Array.isArray(dashboard?.recent_submissions) ? dashboard.recent_submissions : [];
  const formatDateTime = (value) => {
    if (!value || Number.isNaN(new Date(value).getTime())) return "Date unavailable";
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  };

  return (
    <>
      <PageHeader
        className="sa-overview-page-header"
        eyebrow="PLATFORM ADMINISTRATION"
        title="Super Admin Dashboard"
        description="Manage organizations, users, subscriptions, and the VidyaExam platform from one place."
        icon={ShieldCheck}
        meta={[
          <span key="welcome">Welcome{user?.name ? `, ${user.name}` : ""}</span>,
          <time key="today">{today}</time>,
        ]}
      />

      {status === "loading" && (
        <BrandLoader
          variant="section"
          className="ve-brand-loader--compact"
          message="Loading platform overview…"
        />
      )}

      {status === "error" ? (
        <section className="sa-content-panel sa-dashboard-error" role="alert">
          <CircleAlert size={21} aria-hidden="true" />
          <div><strong>Platform data could not be loaded</strong><p>{error}</p></div>
          <button className="sa-button sa-button--secondary" type="button" onClick={() => setReloadKey((key) => key + 1)}><RefreshCw size={15} aria-hidden="true" />Retry</button>
        </section>
      ) : status === "ready" && (
        <>
          <section className="sa-metrics-grid" aria-label="Platform overview">
            <MetricCard label="Organizations" Icon={Building2} value={formatNumber(tenants.total_tenants)} stateLabel={`${formatNumber(tenants.active_tenants)} active · ${formatNumber(tenants.inactive_tenants)} inactive`} isLive />
            <MetricCard label="Platform users" Icon={Users} value={formatNumber(users.total_users)} stateLabel={`${formatNumber(users.total_students)} students · ${formatNumber(users.total_teachers)} teachers`} isLive />
            <MetricCard label="Exams" Icon={CalendarDays} value={formatNumber(exams.total_exams)} stateLabel={`${formatNumber(exams.published_exams)} published · ${formatNumber(exams.draft_exams)} drafts`} isLive />
            <MetricCard label="Questions" Icon={BookOpen} value={formatNumber(questions.total_questions)} stateLabel={`${formatNumber(questions.global_questions)} global · ${formatNumber(questions.tenant_questions)} institute`} isLive />
            <MetricCard label="Submitted attempts" Icon={ChartNoAxesCombined} value={formatNumber(activity.total_submitted)} stateLabel={`${formatNumber(activity.ongoing_attempts)} ongoing · ${formatNumber(activity.total_attempts)} total`} isLive />
          </section>

          <section className="sa-content-panel sa-platform-breakdown">
            <div className="sa-panel-heading"><div><span className="sa-eyebrow">PLATFORM HEALTH</span><h2>Usage & performance</h2></div><p>Latest platform-wide activity and content totals.</p></div>
            <div className="sa-breakdown-grid">
              <article><span>New organizations · 30 days</span><strong>{formatNumber(tenants.new_tenants_last_30_days)}</strong></article>
              <article><span>New users · 30 days</span><strong>{formatNumber(users.new_users_last_30_days)}</strong></article>
              <article><span>Tenant admins</span><strong>{formatNumber(users.total_tenant_admins)}</strong></article>
              <article><span>Global mock tests</span><strong>{formatNumber(exams.global_mock_tests)}</strong></article>
              <article><span>Institute exams</span><strong>{formatNumber(exams.institute_private_exams)}</strong></article>
              <article><span>Ongoing attempts</span><strong>{formatNumber(activity.ongoing_attempts)}</strong></article>
              <article><span>Passed · failed</span><strong>{formatNumber(activity.total_passed)} · {formatNumber(activity.total_failed)}</strong></article>
              <article><span>Average score · pass rate</span><strong>{Number(activity.platform_avg_score_percentage || 0).toFixed(1)}% · {Number(activity.platform_pass_rate_percentage || 0).toFixed(1)}%</strong></article>
              <article><span>Subjects · topics</span><strong>{formatNumber(questions.total_subjects)} · {formatNumber(questions.total_topics)}</strong></article>
            </div>
          </section>

          <section className="sa-dashboard-data-grid">
            <article className="sa-content-panel sa-dashboard-list-panel">
              <div className="sa-panel-heading"><div><span className="sa-eyebrow">ORGANIZATION DIRECTORY</span><h2>Recent organizations</h2></div><Link className="sa-button sa-button--secondary" to={`${SUPER_ADMIN_DASHBOARD}/organizations`}>View all <ArrowRight size={15} aria-hidden="true" /></Link></div>
              {recentTenants.length ? <div className="sa-dashboard-list">
                {recentTenants.map((tenant) => <Link className="sa-dashboard-tenant" key={tenant.tenant_id} to={`${SUPER_ADMIN_DASHBOARD}/organizations`}>
                  <span className="sa-dashboard-avatar">{String(tenant.tenant_name || "O").charAt(0).toUpperCase()}</span>
                  <span className="sa-dashboard-tenant__copy"><strong>{tenant.tenant_name || "Untitled organization"}</strong><small>{tenant.tenant_code || "No tenant code"}</small></span>
                  <span className={`sa-dashboard-status${tenant.is_active ? " is-active" : " is-inactive"}`}>{tenant.is_active ? "Active" : "Inactive"}</span>
                  <small className="sa-dashboard-date">{formatDateTime(tenant.created_at)}</small>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>)}
              </div> : <p className="sa-dashboard-empty">No organizations have been added yet.</p>}
            </article>

            <article className="sa-content-panel sa-dashboard-list-panel">
              <div className="sa-panel-heading"><div><span className="sa-eyebrow">TESTING ACTIVITY</span><h2>Recent submissions</h2></div><span className="sa-dashboard-total">{formatNumber(activity.total_submitted)} submitted</span></div>
              {submissions.length ? <div className="sa-dashboard-list">
                {submissions.map((item) => <article className="sa-dashboard-submission" key={item.attempt_id}>
                  <div className="sa-dashboard-submission__copy"><strong>{item.student_name || "Student"}</strong><span>{item.exam_title || "Exam"}</span><small>{item.tenant_name || "Organization"}</small></div>
                  <div className="sa-dashboard-submission__result"><strong>{Number(item.score_obtained || 0).toFixed(2)} <small>/ {Number(item.total_marks || 0).toFixed(2)}</small></strong><span className={item.is_passed ? "is-passed" : "is-failed"}>{item.is_passed ? "Passed" : "Failed"} · {Number(item.percentage || 0).toFixed(1)}%</span><time dateTime={item.submitted_at}>{formatDateTime(item.submitted_at)}</time></div>
                </article>)}
              </div> : <p className="sa-dashboard-empty">Submitted exam results will appear here.</p>}
            </article>
          </section>
        </>
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
  const { section, tab } = useParams();
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
            {!['questions', 'master', 'taxonomy'].includes(activeSection) && <PageHeader
              className="sa-section-page-header"
              eyebrow="SUPER ADMIN WORKSPACE"
              title={sectionInfo.title}
              description={sectionInfo.description}
              icon={activeSection === "organizations" ? Building2 : activeSection === "users" ? Users : activeSection === "teachers" ? UserRound : activeSection === "students" ? GraduationCap : activeSection === "subscriptions" ? CreditCard : activeSection === "analytics" ? ChartNoAxesCombined : Settings2}
            />}
            {activeSection === "organizations" ? (
              <Suspense
                fallback={<BrandLoader variant="content" message="Loading organizations…" />}
              >
                <TenantsSection />
              </Suspense>
            ) : activeSection === "users" ? (
              <Suspense
                fallback={<BrandLoader variant="content" message="Loading users…" />}
              >
                <UsersSection initialRole="ALL" />
              </Suspense>
            ) : activeSection === "taxonomy" ? (
              <Suspense
                fallback={<BrandLoader variant="content" message="Loading taxonomy…" />}
              >
                <TaxonomySection />
              </Suspense>
            ) : activeSection === "master" ? (
              tab === "batches" || !tab ? <BatchesPage /> : <MasterWorkspaceSection page={tab} />
            ) : activeSection === "teachers" ? (
              <Suspense
                fallback={<BrandLoader variant="content" message="Loading teachers…" />}
              >
                <UsersSection initialRole="TEACHER" title="Teachers Directory" />
              </Suspense>
            ) : activeSection === "students" ? (
              <Suspense
                fallback={<BrandLoader variant="content" message="Loading students…" />}
              >
                <UsersSection initialRole="STUDENT" title="Students Directory" />
              </Suspense>
            ) : activeSection === "subscriptions" ? (
              <PlansSection />
            ) : activeSection === "questions" ? (
              <Suspense fallback={<BrandLoader variant="content" message="Loading question bank…" />}>
                <QuestionBankPage initialCreate={tab === "create"} compact />
              </Suspense>
            ) : (
              <UnavailableSection section={activeSection} />
            )}
          </>
        ) : (
          <PageHeader
            className="sa-section-page-header"
            title="Dashboard section not found"
            actions={<Link className="sa-button sa-button--primary" to={SUPER_ADMIN_DASHBOARD}>Back to dashboard</Link>}
          />
        )}
      </div>
    </div>
  );
}
