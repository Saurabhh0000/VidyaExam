import { ChevronLeft, ChevronRight } from "lucide-react";
import "./pagination.css";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (
    !Number.isInteger(currentPage) ||
    !Number.isInteger(totalPages) ||
    totalPages <= 1
  ) {
    return null;
  }

  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }

    onPageChange(page);
  };

  return (
    <nav className="ve-pagination" aria-label="Table pagination">
      <button
        type="button"
        className="ve-pagination-arrow"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Go to previous page"
        title="Previous page">
        <ChevronLeft size={18} aria-hidden="true" />
      </button>

      <span
        className="ve-pagination-status"
        aria-live="polite"
        aria-atomic="true">
        <span className="ve-pagination-current">{currentPage}</span>
        <span className="ve-pagination-divider">of</span>
        <span className="ve-pagination-total">{totalPages}</span>
      </span>

      <button
        type="button"
        className="ve-pagination-arrow"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Go to next page"
        title="Next page">
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </nav>
  );
}
