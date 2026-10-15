import DataTable from "react-data-table-component";
import styled from "styled-components";
import {
  Building2,
  Eye,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Calendar,
  Users,
} from "lucide-react";
import {
  formatDate,
  formatInterval,
  formatTenantType,
} from "../utils/tenantFormatters";
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

export default function TenantsTable({ tenants, onSelectTenant }) {
  const columns = [
    {
      name: "Organization",
      selector: (row) => row.tenantName,
      sortable: true,
      grow: 1.8,
      cell: (row) => (
        <div className="sa-org-cell">
          <div className="sa-org-avatar">
            {row.tenantName.charAt(0).toUpperCase()}
          </div>
          <div className="sa-org-info">
            <button
              type="button"
              className="sa-org-name-btn"
              onClick={() => onSelectTenant?.(row)}
            >
              <strong>{row.tenantName}</strong>
            </button>
            <div className="sa-org-meta">
              <span className="sa-code-badge">{row.tenantCode}</span>
              <span className="sa-type-tag">
                {formatTenantType(row.tenantType)}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      name: "Contact",
      grow: 1.4,
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
          </div>
          {row.mobileNo && (
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
          )}
        </div>
      ),
    },
    {
      name: "Plan & Status",
      selector: (row) => row.planName,
      sortable: true,
      grow: 1.2,
      cell: (row) => {
        const isSubActive = row.subscriptionStatus === "ACTIVE";
        return (
          <div className="sa-plan-cell">
            <div className="sa-plan-pill-row">
              <span className="sa-plan-badge">{row.planName}</span>
              <span className="sa-interval-text">
                {formatInterval(row.billingInterval)}
              </span>
            </div>
            <span
              className={`sa-sub-badge ${
                isSubActive ? "is-active" : "is-inactive"
              }`}
            >
              {isSubActive ? (
                <CheckCircle2 size={11} aria-hidden="true" />
              ) : (
                <XCircle size={11} aria-hidden="true" />
              )}
              {row.subscriptionStatus}
            </span>
          </div>
        );
      },
    },
    {
      name: "Limits & Members",
      selector: (row) => row.activeMembersCount,
      sortable: true,
      grow: 1.3,
      cell: (row) => (
        <div className="sa-limits-cell">
          <div className="sa-members-count">
            <Users size={13} className="sa-limits-icon" aria-hidden="true" />
            <strong>{row.activeMembersCount}</strong>
            <span>active members</span>
          </div>
          <div className="sa-limits-detail">
            <span>{row.limits?.students ?? 0} students</span>
            <span>·</span>
            <span>{row.limits?.teachers ?? 0} teachers</span>
          </div>
        </div>
      ),
    },
    {
      name: "Joined",
      selector: (row) => row.createdAt?.getTime?.() || 0,
      sortable: true,
      grow: 0.9,
      hide: "md",
      cell: (row) => (
        <div className="sa-date-cell">
          <Calendar size={13} className="sa-date-icon" aria-hidden="true" />
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
          aria-label={`View details for ${row.tenantName}`}
          title="View details"
          onClick={() => onSelectTenant?.(row)}
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
        data={tenants}
        keyField="tenantId"
        responsive
        striped
        highlightOnHover
        pagination
        paginationPerPage={10}
        paginationRowsPerPageOptions={[5, 10, 20, 50]}
        paginationComponent={TenantPagination}
        noDataComponent={
          <div className="sa-inline-empty">
            <Building2 size={24} aria-hidden="true" />
            <p>No organizations found matching the criteria.</p>
          </div>
        }
      />
    </div>
  );
}
