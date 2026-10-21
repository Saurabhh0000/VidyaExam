import { Boxes, ClipboardList, PanelsTopLeft } from "lucide-react";
import PageHeader from "./ui/PageHeader";
import { useLocation, useNavigate } from "react-router-dom";
import "./master-workspace-section.css";
import "../../features/super-admin/styles/super-admin-dashboard.css";

const MASTER_PAGES = {
  batches: {
    label: "Batches",
    description: "Organize learners and staff into batches for your workspace.",
    Icon: Boxes,
  },
  exams: {
    label: "Exams",
    description: "Manage exams available to your platform or organization.",
    Icon: ClipboardList,
  },
  sections: {
    label: "Sections",
    description: "Organize exam content into clear sections.",
    Icon: PanelsTopLeft,
  },
};

export function MasterWorkspaceStats({ page = "batches", batchCount }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const masterBase = pathname.match(/^(.*\/master)(?:\/.*)?$/)?.[1] || pathname;

  return (
    <section className="sa-tenants-stats-bar master-workspace__stats" aria-label="Master data overview">
      {Object.entries(MASTER_PAGES).map(([key, item], index) => {
        const StatIcon = item.Icon;
        const value = key === "batches" && Number.isFinite(batchCount) ? batchCount : "0";
        return (
          <button key={key} type="button" className={`sa-tenant-stat-card master-workspace__stat ${page === key ? "is-selected-card" : ""}`} onClick={() => navigate(`${masterBase}/${key}`)} aria-current={page === key ? "page" : undefined}>
            <span className={`sa-tstat-icon ${index === 0 ? "is-teal" : index === 1 ? "is-navy" : "is-amber"}`}><StatIcon size={20} aria-hidden="true" /></span>
            <span className="sa-tstat-copy"><span className="sa-tstat-label">{item.label}</span><strong className="sa-tstat-value">{value}</strong><span className="sa-tstat-meta">{key === "batches" ? "Total batches" : "Coming soon"}</span></span>
          </button>
        );
      })}
    </section>
  );
}

export function MasterWorkspaceTabs({ page = "batches", batchCount, action }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const masterBase = pathname.match(/^(.*\/master)(?:\/.*)?$/)?.[1] || pathname;
  return <div className="sa-taxonomy-tabs-header master-workspace__tabs-header">
    <nav className="sa-taxonomy-tabs" aria-label="Master data sections">
      {Object.entries(MASTER_PAGES).map(([key, item]) => {
        const TabIcon = item.Icon;
        const value = key === "batches" && Number.isFinite(batchCount) ? batchCount : 0;
        return <button key={key} type="button" className={`sa-tax-tab-btn${page === key ? " is-active" : ""}`} onClick={() => navigate(`${masterBase}/${key}`)} aria-current={page === key ? "page" : undefined}><TabIcon size={16} aria-hidden="true" />{item.label}<span className="sa-tax-tab-badge">{value}</span></button>;
      })}
    </nav>
    {action && <div className="sa-taxonomy-header-actions">{action}</div>}
  </div>;
}

export default function MasterWorkspaceSection({ page = "batches" }) {
  const current = MASTER_PAGES[page] || MASTER_PAGES.batches;
  const { Icon } = current;

  return (
    <section className="master-workspace sa-taxonomy-section" aria-labelledby="master-workspace-title">
      <MasterWorkspaceStats page={page} />
      <div className="sa-content-panel sa-taxonomy-panel master-workspace__panel">
        <MasterWorkspaceTabs page={page} />
        <div className="sa-tax-tab-content">
          <PageHeader
            className="master-workspace__page-header"
            eyebrow="MASTER DATA"
            title={current.label}
            description={current.description}
            icon={Icon}
          />
          <div className="master-workspace__empty sa-table-empty" role="status">
            <span className="master-workspace__icon"><Icon size={24} aria-hidden="true" /></span>
            <h2>{current.label} management is ready for setup</h2>
            <p>There are no {current.label.toLowerCase()} to display yet.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
