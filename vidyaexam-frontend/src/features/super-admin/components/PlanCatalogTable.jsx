import DataTable from "react-data-table-component";
import styled from "styled-components";
import { formatPrice, intervalSuffix, planRows } from "../../../shared/utils/plans";

const PlanTable = styled(DataTable)`
  .rdt_Table { background: transparent; }
  .rdt_TableHeadRow {
    min-height: 48px;
    background: #f4f8f7;
    border-bottom: 1px solid #dce8e6;
  }
  .rdt_TableCol {
    color: #53657b;
    font-size: 0.7rem;
    font-weight: 750;
    letter-spacing: 0.025em;
  }
  .rdt_TableRow {
    min-height: 58px;
    color: #263b59;
    border-bottom: 1px solid #edf2f1;
    transition: background-color 140ms ease;
  }
  .rdt_TableRow:hover { background: #f7fbfa; }
  .rdt_TableCell { padding: 10px 12px; font-size: 0.78rem; }
  .rdt_Pagination {
    min-height: 52px;
    color: #64748b;
    border-top: 1px solid #edf2f1;
    font-size: 0.73rem;
  }
  @media (max-width: 640px) {
    .rdt_TableCell { padding: 9px 7px; font-size: 0.71rem; }
    .rdt_TableCol { padding: 0 7px; font-size: 0.65rem; }
  }
`;

function formatPlanPrice(plan) {
  return formatPrice(plan.price, plan.currency);
}

export default function PlanCatalogTable({ plans, title }) {
  const columns = [
    {
      name: "Plan",
      selector: (plan) => plan.name,
      sortable: true,
      grow: 1.1,
      cell: (plan) => <strong className="sa-plan-name-cell">{plan.name}</strong>,
    },
    {
      name: "Audience",
      selector: (plan) => plan.scope,
      sortable: true,
      cell: (plan) => (
        <span className={`sa-plan-audience${plan.scope === "TENANT" ? " is-tenant" : ""}`}>
          {plan.scope === "TENANT" ? "Organization" : "Individual"}
        </span>
      ),
    },
    {
      name: "Billing",
      selector: (plan) => plan.rawInterval,
      sortable: true,
      hide: "sm",
      cell: (plan) => String(plan.rawInterval || "Not set").replaceAll("_", " ").toLowerCase(),
    },
    {
      name: "Price",
      selector: (plan) => plan.price,
      sortable: true,
      right: true,
      cell: (plan) => (
        <strong className="sa-plan-price-cell">
          {formatPlanPrice(plan)}
          {intervalSuffix(plan) && <small> {intervalSuffix(plan)}</small>}
        </strong>
      ),
    },
    {
      name: "Included limits & features",
      hide: "sm",
      grow: 1.8,
      cell: (plan) => {
        const included = planRows(plan).filter((row) => row.included);
        return included.length ? (
          <span className="sa-plan-details" title={included.map((row) => row.label).join(", ")}>
            {included.map((row) => row.label).join(" · ")}
          </span>
        ) : (
          <span className="sa-plan-details is-muted">Not configured</span>
        );
      },
    },
  ];

  return (
    <div className="sa-plan-table-wrap">
      <PlanTable
        ariaLabel={`${title} catalog`}
        className="sa-plan-table"
        columns={columns}
        data={plans}
        keyField="id"
        responsive
        striped
        highlightOnHover
        pagination={plans.length > 8}
        paginationPerPage={8}
        paginationRowsPerPageOptions={[8, 16, 32]}
        noDataComponent={<span className="sa-inline-empty">No active plans in this category.</span>}
      />
    </div>
  );
}
