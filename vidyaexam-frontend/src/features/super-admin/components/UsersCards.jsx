import {
  Users,
  Mail,
  Phone,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { formatDate } from "../utils/tenantFormatters";
import { formatRole, getRoleBadgeClass, formatLastLogin } from "../utils/userFormatters";

export default function UsersCards({ users, onSelectUser }) {
  if (!users || users.length === 0) {
    return (
      <div className="sa-inline-empty sa-cards-empty">
        <Users size={32} aria-hidden="true" />
        <p>No users found matching the criteria.</p>
      </div>
    );
  }

  return (
    <div className="sa-cards-grid">
      {users.map((user) => {
        const roleClass = getRoleBadgeClass(user.defaultRole);
        const isActive = user.isActive;

        return (
          <article
            key={user.userId}
            className="sa-tenant-card sa-user-card"
            onClick={() => onSelectUser?.(user)}
          >
            {/* Top Bar: Avatar, Name, Role badge & Active indicator */}
            <div className="sa-card-header">
              <div className={`sa-card-avatar ${roleClass}`}>
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="sa-card-header-main">
                <div className="sa-card-title-row">
                  <h3 className="sa-card-title" title={user.fullName}>
                    {user.fullName}
                  </h3>
                </div>
                <div className="sa-card-meta-chips">
                  <span className={`sa-user-role-badge ${roleClass}`}>
                    {formatRole(user.defaultRole)}
                  </span>
                  <code className="sa-code-badge" title={user.userId}>
                    {user.userId.substring(0, 8)}...
                  </code>
                </div>
              </div>
              <span
                className={`sa-status-dot-badge ${
                  isActive ? "is-active" : "is-inactive"
                }`}
                title={isActive ? "Active User" : "Inactive User"}
              >
                <span className="sa-status-dot" />
              </span>
            </div>

            {/* Middle Section: Contact Details */}
            <div className="sa-card-contact-box">
              <div className="sa-card-contact-row">
                <Mail size={13} className="sa-card-icon" aria-hidden="true" />
                <a
                  href={`mailto:${user.email}`}
                  className="sa-card-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  {user.email}
                </a>
                {user.emailVerified ? (
                  <CheckCircle2
                    size={12}
                    className="sa-verified-icon"
                    title="Email verified"
                  />
                ) : (
                  <AlertCircle
                    size={12}
                    className="sa-unverified-icon"
                    title="Email not verified"
                  />
                )}
              </div>
              {user.mobileNo ? (
                <div className="sa-card-contact-row">
                  <Phone size={13} className="sa-card-icon" aria-hidden="true" />
                  <a
                    href={`tel:${user.mobileNo}`}
                    className="sa-card-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {user.mobileNo}
                  </a>
                </div>
              ) : (
                <div className="sa-card-contact-row">
                  <Phone size={13} className="sa-card-icon" aria-hidden="true" />
                  <span className="sa-no-phone">No mobile</span>
                </div>
              )}
            </div>

            {/* Session Info Bar */}
            <div className="sa-card-session-info">
              <Clock size={12} aria-hidden="true" />
              <span>
                Last active:{" "}
                <strong>
                  {user.lastLoginAt ? formatDate(user.lastLoginAt, true) : "Never"}
                </strong>
              </span>
            </div>

            {/* Footer */}
            <div className="sa-card-footer">
              <span className="sa-card-date">
                <Calendar size={12} aria-hidden="true" />
                Joined {formatDate(user.createdAt)}
              </span>
              <button
                type="button"
                className="sa-card-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectUser?.(user);
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
