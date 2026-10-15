import DataTable from "react-data-table-component";
import styled from "styled-components";
import { FolderGit2, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { formatDate } from "../../utils/tenantFormatters";
import { TaxonomyPagination } from "../TenantControls";

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
    min-height: 60px;
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

export default function CategoriesTable({ categories }) {
  const columns = [
    {
      name: "Category",
      selector: (row) => row.category_name,
      sortable: true,
      grow: 1.6,
      cell: (row) => (
        <div className="sa-taxonomy-cell">
          <div className="sa-taxonomy-icon is-cat">
            <FolderGit2 size={16} aria-hidden="true" />
          </div>
          <div className="sa-taxonomy-info">
            <strong>{row.category_name}</strong>
            <span className="sa-code-badge">{row.category_code}</span>
          </div>
        </div>
      ),
    },
    {
      name: "Description",
      selector: (row) => row.description,
      grow: 2,
      cell: (row) => (
        <span className="sa-desc-cell" title={row.description || ""}>
          {row.description || <em className="sa-muted-text">No description provided</em>}
        </span>
      ),
    },
    {
      name: "Status",
      selector: (row) => row.is_active,
      sortable: true,
      grow: 0.8,
      cell: (row) => (
        <span
          className={`sa-status-pill ${
            row.is_active ? "is-active" : "is-inactive"
          }`}
        >
          <span className="sa-status-dot" />
          {row.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      name: "Created On",
      selector: (row) => row.created_at,
      sortable: true,
      grow: 1,
      cell: (row) => (
        <div className="sa-date-cell">
          <Calendar size={13} className="sa-date-icon" aria-hidden="true" />
          <span>{formatDate(row.created_at)}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="sa-table-wrapper">
      <StyledTable
        columns={columns}
        data={categories}
        pagination
        paginationComponent={TaxonomyPagination}
        paginationPerPage={10}
        paginationRowsPerPageOptions={[10, 20, 50]}
        responsive
        noDataComponent={
          <div className="sa-table-empty">
            <FolderGit2 size={32} className="sa-empty-icon" aria-hidden="true" />
            <p>No categories found</p>
            <small>Create an exam category to start structuring curriculum.</small>
          </div>
        }
      />
    </div>
  );
}
