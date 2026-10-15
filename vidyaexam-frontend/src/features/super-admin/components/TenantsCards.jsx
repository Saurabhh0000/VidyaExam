import {
  Building2,
  Mail,
  Phone,
  Calendar,
  Users,
  GraduationCap,
  Shield,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import {
  formatDate,
  formatInterval,
  formatTenantType,
} from "../utils/tenantFormatters";

export default function TenantsCards({ tenants, onSelectTenant }) {
  if (!tenants || tenants.length === 0) {
    return (
      <div className="sa-inline-empty sa-cards-empty">
        <Building2 size={32} aria-hidden="true" />
        <p>No organizations found matching the criteria.</p>
      </div>
    );
  }

  return (
    <div className="sa-cards-grid">
      {tenants.map((tenant) => {
        const isSubActive = tenant.subscriptionStatus === "ACTIVE";
        const isTenantActive = tenant.isActive;

        return (
          <article
            key={tenant.tenantId}
            className="sa-tenant-card"
            onClick={() => onSelectTenant?.(tenant)}
          >
            {/* Top Bar: Icon, Name, Code & Active Pill */}
            <div className="sa-card-header">
              <div className="sa-card-avatar">
                {tenant.tenantName.charAt(0).toUpperCase()}
              </div>
              <div className="sa-card-header-main">
                <div className="sa-card-title-row">
                  <h3 className="sa-card-title" title={tenant.tenantName}>
                    {tenant.tenantName}
                  </h3>
                </div>
                <div className="sa-card-meta-chips">
                  <span className="sa-code-badge">{tenant.tenantCode}</span>
                  <span className="sa-type-tag">
                    {formatTenantType(tenant.tenantType)}
                  </span>
                </div>
              </div>
              <span
                className={`sa-status-dot-badge ${
                  isTenantActive ? "is-active" : "is-inactive"
                }`}
                title={isTenantActive ? "Active Tenant" : "Inactive Tenant"}
              >
                <span className="sa-status-dot" />
              </span>
            </div>

            {/* Middle Section: Contact Details */}
            <div className="sa-card-contact-box">
              <div className="sa-card-contact-row">
                <Mail size={13} className="sa-card-icon" aria-hidden="true" />
                <a
                  href={`mailto:${tenant.email}`}
                  className="sa-card-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  {tenant.email}
                </a>
              </div>
              {tenant.mobileNo && (
                <div className="sa-card-contact-row">
                  <Phone size={13} className="sa-card-icon" aria-hidden="true" />
                  <a
                    href={`tel:${tenant.mobileNo}`}
                    className="sa-card-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {tenant.mobileNo}
                  </a>
                </div>
              )}
            </div>

            {/* Plan & Subscription Status Banner */}
            <div className="sa-card-plan-banner">
              <div className="sa-card-plan-info">
                <span className="sa-plan-badge">{tenant.planName}</span>
                <span className="sa-interval-text">
                  {formatInterval(tenant.billingInterval)}
                </span>
              </div>
              <span
                className={`sa-sub-badge ${
                  isSubActive ? "is-active" : "is-inactive"
                }`}
              >
                {isSubActive ? (
                  <CheckCircle2 size={12} aria-hidden="true" />
                ) : (
                  <XCircle size={12} aria-hidden="true" />
                )}
                {tenant.subscriptionStatus}
              </span>
            </div>

            {/* Resource Quota Indicators */}
            <div className="sa-card-limits-row">
              <div className="sa-card-limit-chip" title="Active Members">
                <Users size={13} aria-hidden="true" />
                <span>
                  <strong>{tenant.activeMembersCount}</strong> Members
                </span>
              </div>
              <div className="sa-card-limit-chip" title="Students Quota">
                <GraduationCap size={13} aria-hidden="true" />
                <span>
                  <strong>{tenant.limits?.students ?? 0}</strong> Students
                </span>
              </div>
              <div className="sa-card-limit-chip" title="Teachers Quota">
                <Shield size={13} aria-hidden="true" />
                <span>
                  <strong>{tenant.limits?.teachers ?? 0}</strong> Teachers
                </span>
              </div>
            </div>

            {/* Card Footer */}
            <div className="sa-card-footer">
              <span className="sa-card-date">
                <Calendar size={12} aria-hidden="true" />
                Joined {formatDate(tenant.createdAt)}
              </span>
              <button
                type="button"
                className="sa-card-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTenant?.(tenant);
                }}
              >
                <span>Details</span>
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
