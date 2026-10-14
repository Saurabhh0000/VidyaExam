import { lazy, Suspense, useEffect, useMemo, useRef } from "react";
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
} from "lucide-react";
import toast from "../../../shared/components/ui/toast";
import useAuthState from "../../auth/utils/useAuthState";
import { SUPER_ADMIN_DASHBOARD } from "../../../app/roleRoutes";
import usePlans from "../../../shared/hooks/usePlans";
import "../styles/super-admin-dashboard.css";

const PlanCatalogTable = lazy(() => import("../components/PlanCatalogTable"));

const SECTIONS = {
  organizations: { title: "Organizations / Tenants", description: "Platform-wide organization directory and tenant administration." },
  users: { title: "Users", description: "Search and manage accounts across VidyaExam." },
  teachers: { title: "Teachers", description: "Platform-wide teacher accounts and organization membership." },
  students: { title: "Students", description: "Platform-wide student accounts and organization membership." },
  subscriptions: { title: "Subscriptions & Plans", description: "View the active individual and tenant plans configured for VidyaExam." },
  analytics: { title: "Reports & Analytics", description: "Platform activity and growth reporting." },
  settings: { title: "Platform Settings", description: "Platform-level configuration and operational settings." },
};

const METRICS = [
  { label: "Total Organizations", Icon: Building2 },
  { label: "Total Users", Icon: Users },
  { label: "Total Teachers", Icon: GraduationCap },
  { label: "Total Students", Icon: UserRound },
  { label: "Active Subscriptions", Icon: CreditCard },
];

function MetricCard({ label, Icon }) {
  return (
    <article className="sa-metric-card" aria-label={`${label}: unavailable`}>
      <span className="sa-metric-icon"><Icon size={20} aria-hidden="true" /></span>
      <span className="sa-metric-label">{label}</span>
      <strong className="sa-metric-value">—</strong>
      <span className="sa-metric-state"><span /> Reporting API unavailable</span>
    </article>
  );
}

function UnavailableSection({ section }) {
  const info = SECTIONS[section];
  const Icon = section === "organizations" ? Building2
    : section === "users" ? Users
      : section === "teachers" ? GraduationCap
        : section === "students" ? UserRound
          : section === "analytics" ? ChartNoAxesCombined : Settings2;
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
      <section className="sa-plans-grid" aria-label="Loading subscription plans" aria-busy="true">
        {[1, 2, 3, 4].map((item) => <div className="sa-plan-skeleton" key={item} />)}
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
      {[
        { title: "Individual plans", plans: individual },
        { title: "Organization plans", plans: tenant },
      ].map((group) => (
        <section className="sa-plan-group" key={group.title}>
          <div className="sa-section-heading"><h2>{group.title}</h2><span>{group.plans.length} active {group.plans.length === 1 ? "plan" : "plans"}</span></div>
          {group.plans.length ? (
            <Suspense fallback={<div className="sa-plan-skeleton" aria-label="Loading table" />}>
              <PlanCatalogTable plans={group.plans} title={group.title} />
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
        {METRICS.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </section>

      <section className="sa-content-panel sa-shortcuts">
        <div className="sa-panel-heading">
          <div><span className="sa-eyebrow">QUICK ACCESS</span><h2>Platform workspaces</h2></div>
          <p>Jump to a platform area. Data appears when the backend API is available.</p>
        </div>
        <div className="sa-shortcut-grid">
          {[
            { title: "Organizations / Tenants", text: "Platform-wide tenant directory", to: `${SUPER_ADMIN_DASHBOARD}/organizations`, Icon: Building2 },
            { title: "Users", text: "Global account administration", to: `${SUPER_ADMIN_DASHBOARD}/users`, Icon: Users },
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
            {activeSection === "subscriptions" ? <PlansSection /> : <UnavailableSection section={activeSection} />}
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
