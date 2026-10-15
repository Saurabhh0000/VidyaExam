import DataTable from "react-data-table-component";
import styled from "styled-components";
import {
  Users,
  Eye,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
} from "lucide-react";
import { formatDate } from "../utils/tenantFormatters";
import { formatRole, getRoleBadgeClass, formatLastLogin } from "../utils/userFormatters";
import { TenantPagination } from "./TenantControls";

const StyledTable = styled(DataTable)`
  .rdt_Table {
    background: transparent;
  }
  .rdt_TableHeadRow {
    min-height: 50px;
    background: #f4f8f7;
    border-bottom: 1px solid #dce8e6;
  }
  .rdt_TableCol {
    color: #53657b;
    font-size: 0.72rem;
    font-weight: 750;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }
  .rdt_TableRow {
    min-height: 64px;
    color: #263b59;
    border-bottom: 1px solid #edf2f1;
    transition: background-color 140ms ease;
  }
  .rdt_TableRow:hover {
    background: #f8fbfa;
  }
  .rdt_TableCell {
    padding: 12px 14px;
    font-size: 0.8rem;
  }
  .rdt_Pagination {
    min-height: 52px;
    color: #64748b;
    border-top: 1px solid #edf2f1;
    font-size: 0.76rem;
  }
  @media (max-width: 640px) {
    .rdt_TableCell {
      padding: 10px 8px;
      font-size: 0.73rem;
    }
    .rdt_TableCol {
      padding: 0 8px;
      font-size: 0.67rem;
    }
  }
`;

export default function UsersTable({ users, onSelectUser }) {
  const columns = [
    {
      name: "User",
      selector: (row) => row.fullName,
      sortable: true,
      grow: 1.6,
      cell: (row) => {
        const roleClass = getRoleBadgeClass(row.defaultRole);
        return (
          <div className="sa-user-cell">
            <div className={`sa-user-avatar ${roleClass}`}>
              {row.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="sa-user-info">
              <button
                type="button"
                className="sa-user-name-btn"
                onClick={() => onSelectUser?.(row)}
              >
                <strong>{row.fullName}</strong>
              </button>
              <div className="sa-user-meta">
                <code className="sa-code-badge" title={row.userId}>
                  {row.userId.substring(0, 8)}...
                </code>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      name: "Role",
      selector: (row) => row.defaultRole,
      sortable: true,
      grow: 1.1,
      cell: (row) => {
        const roleClass = getRoleBadgeClass(row.defaultRole);
        return (
          <span className={`sa-user-role-badge ${roleClass}`}>
            {formatRole(row.defaultRole)}
          </span>
        );
      },
    },
    {
      name: "Contact Info",
      grow: 1.5,
      cell: (row) => (
        <div className="sa-contact-cell">
          <div className="sa-contact-line">
            <Mail size={12} className="sa-contact-icon" aria-hidden="true" />
            <a
              href={`mailto:${row.email}`}
              className="sa-contact-link"
              title={row.email}
            >
              {row.email}
            </a>
            {row.emailVerified ? (
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
          {row.mobileNo ? (
            <div className="sa-contact-line">
              <Phone size={12} className="sa-contact-icon" aria-hidden="true" />
              <a
                href={`tel:${row.mobileNo}`}
                className="sa-contact-link"
                title={row.mobileNo}
              >
                {row.mobileNo}
              </a>
            </div>
          ) : (
            <span className="sa-no-phone">No mobile</span>
          )}
        </div>
      ),
    },
    {
      name: "Status",
      selector: (row) => row.isActive,
      sortable: true,
      grow: 0.9,
      cell: (row) => (
        <span
          className={`sa-status-pill ${
            row.isActive ? "is-active" : "is-inactive"
          }`}
        >
          <span className="sa-status-dot" />
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      name: "Last Login",
      selector: (row) => row.lastLoginAt?.getTime?.() || 0,
      sortable: true,
      grow: 1.1,
      hide: "md",
      cell: (row) => (
        <div className="sa-date-cell">
          <Clock size={12} className="sa-date-icon" aria-hidden="true" />
          <span>{row.lastLoginAt ? formatDate(row.lastLoginAt, true) : "Never"}</span>
        </div>
      ),
    },
    {
      name: "Joined",
      selector: (row) => row.createdAt?.getTime?.() || 0,
      sortable: true,
      grow: 0.9,
      hide: "sm",
      cell: (row) => (
        <div className="sa-date-cell">
          <Calendar size={12} className="sa-date-icon" aria-hidden="true" />
          <span>{formatDate(row.createdAt)}</span>
        </div>
      ),
    },
    {
      name: "Action",
      right: true,
      grow: 0.7,
      cell: (row) => (
        <button
          type="button"
          className="sa-action-btn"
          aria-label={`View details for ${row.fullName}`}
          title="View details"
          onClick={() => onSelectUser?.(row)}
        >
          <Eye size={15} aria-hidden="true" />
          <span>Details</span>
        </button>
      ),
    },
  ];

  return (
    <div className="sa-tenants-table-wrapper">
      <StyledTable
        columns={columns}
        data={users}
        keyField="userId"
        responsive
        striped
        highlightOnHover
        pagination
        paginationPerPage={10}
        paginationRowsPerPageOptions={[5, 10, 20, 50]}
        paginationComponent={TenantPagination}
        noDataComponent={
          <div className="sa-inline-empty">
            <Users size={24} aria-hidden="true" />
            <p>No users found matching the criteria.</p>
          </div>
        }
      />
    </div>
  );
}
