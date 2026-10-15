import {
  Building2,
  Copy,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Users,
  GraduationCap,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Clock,
  Sparkles,
  Shield,
} from "lucide-react";
import Modal from "../../../shared/components/ui/Modal";
import {
  formatDate,
  formatInterval,
  formatTenantType,
  copyToClipboard,
} from "../utils/tenantFormatters";

export default function TenantDetailsModal({ tenant, isOpen, onClose }) {
  if (!tenant) return null;

  const isSubActive = tenant.subscriptionStatus === "ACTIVE";
  const isTenantActive = tenant.isActive;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="lg"
      className="sa-tenant-modal"
      footer={
        <div className="sa-modal-footer-actions">
          <button
            type="button"
            className="sa-btn sa-btn--primary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      }
    >
      <div className="sa-tenant-modal-body">
        {/* Header Hero */}
        <div className="sa-modal-hero">
          <div className="sa-modal-hero-left">
            <div className="sa-modal-avatar">
              <Building2 size={26} aria-hidden="true" />
            </div>
            <div>
              <div className="sa-modal-title-row">
                <h3>{tenant.tenantName}</h3>
                <span className="sa-code-badge">{tenant.tenantCode}</span>
              </div>
              <p className="sa-modal-subtitle">
                {formatTenantType(tenant.tenantType)}
              </p>
            </div>
          </div>
          <div className="sa-modal-badges">
            <span
              className={`sa-status-pill ${
                isTenantActive ? "is-active" : "is-inactive"
              }`}
            >
              <span className="sa-status-dot" />
              {isTenantActive ? "Active Tenant" : "Inactive Tenant"}
            </span>
            <span
              className={`sa-status-pill ${
                isSubActive ? "is-sub-active" : "is-sub-inactive"
              }`}
            >
              {isSubActive ? (
                <CheckCircle2 size={13} aria-hidden="true" />
              ) : (
                <XCircle size={13} aria-hidden="true" />
              )}
              {tenant.subscriptionStatus} Sub
            </span>
          </div>
        </div>

        {/* Quick Highlights Grid */}
        <div className="sa-modal-stats-grid">
          <div className="sa-modal-stat-card">
            <div className="sa-modal-stat-icon is-teal">
              <Users size={18} aria-hidden="true" />
            </div>
            <div className="sa-modal-stat-info">
              <span className="sa-modal-stat-label">Active Members</span>
              <strong className="sa-modal-stat-value">
                {tenant.activeMembersCount}
              </strong>
            </div>
          </div>
          <div className="sa-modal-stat-card">
            <div className="sa-modal-stat-icon is-blue">
              <GraduationCap size={18} aria-hidden="true" />
            </div>
            <div className="sa-modal-stat-info">
              <span className="sa-modal-stat-label">Student Quota</span>
              <strong className="sa-modal-stat-value">
                {tenant.limits?.students ?? 0} seats
              </strong>
            </div>
          </div>
          <div className="sa-modal-stat-card">
            <div className="sa-modal-stat-icon is-purple">
              <Shield size={18} aria-hidden="true" />
            </div>
            <div className="sa-modal-stat-info">
              <span className="sa-modal-stat-label">Teacher Quota</span>
              <strong className="sa-modal-stat-value">
                {tenant.limits?.teachers ?? 0} seats
              </strong>
            </div>
          </div>
          <div className="sa-modal-stat-card">
            <div className="sa-modal-stat-icon is-amber">
              <Sparkles size={18} aria-hidden="true" />
            </div>
            <div className="sa-modal-stat-info">
              <span className="sa-modal-stat-label">Plan Tier</span>
              <strong className="sa-modal-stat-value">
                {tenant.planName}
              </strong>
            </div>
          </div>
        </div>

        {/* Organization Info Section */}
        <div className="sa-modal-section">
          <h4 className="sa-modal-section-title">
            <Building2 size={16} aria-hidden="true" />
            Organization Details
          </h4>
          <div className="sa-modal-details-grid">
            <div className="sa-detail-item">
              <span className="sa-detail-label">Tenant ID</span>
              <div className="sa-detail-value-wrap">
                <code className="sa-detail-id">{tenant.tenantId}</code>
                <button
                  type="button"
                  className="sa-icon-btn"
                  title="Copy Tenant ID"
                  aria-label="Copy Tenant ID"
                  onClick={() => copyToClipboard(tenant.tenantId, "Tenant ID")}
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            <div className="sa-detail-item">
              <span className="sa-detail-label">Tenant Code</span>
              <span className="sa-detail-value sa-bold">
                {tenant.tenantCode}
              </span>
            </div>

            <div className="sa-detail-item">
              <span className="sa-detail-label">Official Email</span>
              <div className="sa-detail-value-wrap">
                <a
                  href={`mailto:${tenant.email}`}
                  className="sa-detail-link"
                >
                  <Mail size={14} aria-hidden="true" />
                  {tenant.email}
                </a>
                <button
                  type="button"
                  className="sa-icon-btn"
                  title="Copy Email"
                  aria-label="Copy Email"
                  onClick={() => copyToClipboard(tenant.email, "Email")}
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            <div className="sa-detail-item">
              <span className="sa-detail-label">Mobile Number</span>
              <div className="sa-detail-value-wrap">
                <a
                  href={`tel:${tenant.mobileNo}`}
                  className="sa-detail-link"
                >
                  <Phone size={14} aria-hidden="true" />
                  {tenant.mobileNo}
                </a>
                <button
                  type="button"
                  className="sa-icon-btn"
                  title="Copy Mobile"
                  aria-label="Copy Mobile Number"
                  onClick={() => copyToClipboard(tenant.mobileNo, "Mobile Number")}
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            <div className="sa-detail-item">
              <span className="sa-detail-label">Registered On</span>
              <span className="sa-detail-value">
                <Calendar size={14} className="sa-detail-icon" aria-hidden="true" />
                {formatDate(tenant.createdAt, true)}
              </span>
            </div>

            <div className="sa-detail-item">
              <span className="sa-detail-label">Institution Type</span>
              <span className="sa-detail-value">
                {formatTenantType(tenant.tenantType)}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription & Limits Section */}
        <div className="sa-modal-section">
          <h4 className="sa-modal-section-title">
            <CreditCard size={16} aria-hidden="true" />
            Subscription &amp; Limits
          </h4>
          <div className="sa-modal-details-grid">
            <div className="sa-detail-item">
              <span className="sa-detail-label">Subscription ID</span>
              <div className="sa-detail-value-wrap">
                <code className="sa-detail-id">{tenant.subscriptionId || "None"}</code>
                {tenant.subscriptionId && (
                  <button
                    type="button"
                    className="sa-icon-btn"
                    title="Copy Subscription ID"
                    aria-label="Copy Subscription ID"
                    onClick={() =>
                      copyToClipboard(tenant.subscriptionId, "Subscription ID")
                    }
                  >
                    <Copy size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className="sa-detail-item">
              <span className="sa-detail-label">Active Plan</span>
              <span className="sa-plan-chip">
                {tenant.planName} · {formatInterval(tenant.billingInterval)}
              </span>
            </div>

            <div className="sa-detail-item">
              <span className="sa-detail-label">Subscription Starts</span>
              <span className="sa-detail-value">
                <Calendar size={14} className="sa-detail-icon" aria-hidden="true" />
                {formatDate(tenant.subscriptionStartsAt)}
              </span>
            </div>

            <div className="sa-detail-item">
              <span className="sa-detail-label">Subscription Ends</span>
              <span className="sa-detail-value">
                {tenant.subscriptionEndsAt ? (
                  <>
                    <Clock size={14} className="sa-detail-icon" aria-hidden="true" />
                    {formatDate(tenant.subscriptionEndsAt)}
                  </>
                ) : (
                  <span className="sa-badge-ongoing">Ongoing / Lifetime</span>
                )}
              </span>
            </div>

            <div className="sa-detail-item">
              <span className="sa-detail-label">Allowed Students</span>
              <span className="sa-detail-value sa-bold">
                {tenant.limits?.students ?? 0} students max
              </span>
            </div>

            <div className="sa-detail-item">
              <span className="sa-detail-label">Allowed Teachers</span>
              <span className="sa-detail-value sa-bold">
                {tenant.limits?.teachers ?? 0} teachers max
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
