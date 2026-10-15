import {
  User,
  Copy,
  Mail,
  Phone,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Shield,
  GraduationCap,
  Users,
} from "lucide-react";
import Modal from "../../../shared/components/ui/Modal";
import { formatDate, copyToClipboard } from "../utils/tenantFormatters";
import { formatRole, getRoleBadgeClass, formatLastLogin } from "../utils/userFormatters";

export default function UserDetailsModal({ user, isOpen, onClose }) {
  if (!user) return null;

  const roleClass = getRoleBadgeClass(user.defaultRole);
  const isVerified = user.emailVerified;
  const isActive = user.isActive;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="md"
      className="sa-user-modal"
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
            <div className={`sa-user-modal-avatar ${roleClass}`}>
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="sa-modal-title-row">
                <h3>{user.fullName}</h3>
              </div>
              <p className="sa-modal-subtitle">{user.email}</p>
            </div>
          </div>
          <div className="sa-modal-badges">
            <span className={`sa-user-role-badge ${roleClass}`}>
              {formatRole(user.defaultRole)}
            </span>
            <span
              className={`sa-status-pill ${
                isActive ? "is-active" : "is-inactive"
              }`}
            >
              <span className="sa-status-dot" />
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Quick Highlights Grid */}
        <div className="sa-modal-stats-grid">
          <div className="sa-modal-stat-card">
            <div className="sa-modal-stat-icon is-teal">
              <Shield size={18} aria-hidden="true" />
            </div>
            <div className="sa-modal-stat-info">
              <span className="sa-modal-stat-label">Role</span>
              <strong className="sa-modal-stat-value">
                {formatRole(user.defaultRole)}
              </strong>
            </div>
          </div>
          <div className="sa-modal-stat-card">
            <div className={`sa-modal-stat-icon ${isVerified ? "is-emerald" : "is-amber"}`}>
              {isVerified ? (
                <CheckCircle2 size={18} aria-hidden="true" />
              ) : (
                <AlertCircle size={18} aria-hidden="true" />
              )}
            </div>
            <div className="sa-modal-stat-info">
              <span className="sa-modal-stat-label">Email Verified</span>
              <strong className="sa-modal-stat-value">
                {isVerified ? "Verified" : "Pending"}
              </strong>
            </div>
          </div>
          <div className="sa-modal-stat-card">
            <div className="sa-modal-stat-icon is-blue">
              <Clock size={18} aria-hidden="true" />
            </div>
            <div className="sa-modal-stat-info">
              <span className="sa-modal-stat-label">Last Login</span>
              <strong className="sa-modal-stat-value" title={formatLastLogin(user.lastLoginAt)}>
                {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}
              </strong>
            </div>
          </div>
          <div className="sa-modal-stat-card">
            <div className="sa-modal-stat-icon is-purple">
              <Calendar size={18} aria-hidden="true" />
            </div>
            <div className="sa-modal-stat-info">
              <span className="sa-modal-stat-label">Joined</span>
              <strong className="sa-modal-stat-value">
                {formatDate(user.createdAt)}
              </strong>
            </div>
          </div>
        </div>

        {/* Account Details Section */}
        <div className="sa-modal-section">
          <h4 className="sa-modal-section-title">
            <User size={16} aria-hidden="true" />
            Account Information
          </h4>
          <div className="sa-modal-details-grid">
            <div className="sa-detail-item">
              <span className="sa-detail-label">User ID</span>
              <div className="sa-detail-value-wrap">
                <code className="sa-detail-id">{user.userId}</code>
                <button
                  type="button"
                  className="sa-icon-btn"
                  title="Copy User ID"
                  aria-label="Copy User ID"
                  onClick={() => copyToClipboard(user.userId, "User ID")}
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            <div className="sa-detail-item">
              <span className="sa-detail-label">Full Name</span>
              <span className="sa-detail-value sa-bold">{user.fullName}</span>
            </div>

            <div className="sa-detail-item">
              <span className="sa-detail-label">Email Address</span>
              <div className="sa-detail-value-wrap">
                <a href={`mailto:${user.email}`} className="sa-detail-link">
                  <Mail size={14} aria-hidden="true" />
                  {user.email}
                </a>
                <button
                  type="button"
                  className="sa-icon-btn"
                  title="Copy Email"
                  aria-label="Copy Email"
                  onClick={() => copyToClipboard(user.email, "Email")}
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            <div className="sa-detail-item">
              <span className="sa-detail-label">Mobile Number</span>
              {user.mobileNo ? (
                <div className="sa-detail-value-wrap">
                  <a href={`tel:${user.mobileNo}`} className="sa-detail-link">
                    <Phone size={14} aria-hidden="true" />
                    {user.mobileNo}
                  </a>
                  <button
                    type="button"
                    className="sa-icon-btn"
                    title="Copy Mobile"
                    aria-label="Copy Mobile Number"
                    onClick={() => copyToClipboard(user.mobileNo, "Mobile Number")}
                  >
                    <Copy size={13} />
                  </button>
                </div>
              ) : (
                <span className="sa-detail-value" style={{ color: "var(--sa-muted)" }}>
                  Not provided
                </span>
              )}
            </div>

            <div className="sa-detail-item">
              <span className="sa-detail-label">Registered On</span>
              <span className="sa-detail-value">
                <Calendar size={14} className="sa-detail-icon" aria-hidden="true" />
                {formatDate(user.createdAt, true)}
              </span>
            </div>

            <div className="sa-detail-item">
              <span className="sa-detail-label">Last Active Session</span>
              <span className="sa-detail-value">
                <Clock size={14} className="sa-detail-icon" aria-hidden="true" />
                {formatLastLogin(user.lastLoginAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
