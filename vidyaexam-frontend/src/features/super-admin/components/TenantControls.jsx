import { useEffect, useId, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export function TenantSelect({ id, value, options, onChange, label, placement = "bottom", compact = false, disabled = false }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const optionsRef = useRef(null);
  const listId = useId();
  const selected = options.find((option) => String(option.value) === String(value)) || options[0];

  useEffect(() => {
    if (!open) return undefined;
    (optionsRef.current?.querySelector('[aria-selected="true"]') || optionsRef.current?.querySelector('[role="option"]'))?.focus();
    const handleOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, [open]);

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) || !open) return;
    const optionsElements = [...(optionsRef.current?.querySelectorAll('[role="option"]') || [])];
    if (!optionsElements.length) return;
    const index = optionsElements.indexOf(document.activeElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? optionsElements.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + optionsElements.length) % optionsElements.length;
    event.preventDefault();
    optionsElements[next]?.focus();
  }

  function choose(option) {
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div className={`sa-custom-select${compact ? " is-compact" : ""}${open ? " is-open" : ""}`} ref={rootRef} onKeyDown={handleKeyDown}>
      <button ref={triggerRef} id={id} type="button" className="sa-custom-select-trigger" aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} disabled={disabled} onClick={() => setOpen((current) => !current)}>
        <span>{selected?.label}</span><ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className={`sa-custom-select-options is-${placement}`} id={listId} role="listbox" aria-label={label} ref={optionsRef}>
          {options.map((option) => (
            <button key={String(option.value)} type="button" role="option" aria-selected={String(option.value) === String(value)} tabIndex={0} onClick={() => choose(option)}>
              <span>{option.label}</span>{String(option.value) === String(value) && <Check size={16} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function TenantPagination({ rowsPerPage, rowCount, currentPage, onChangePage, onChangeRowsPerPage, paginationRowsPerPageOptions = [], placement = "bottom" }) {
  const pageCount = Math.max(1, Math.ceil(rowCount / rowsPerPage));
  const firstRow = rowCount ? (currentPage - 1) * rowsPerPage + 1 : 0;
  const lastRow = Math.min(currentPage * rowsPerPage, rowCount);
  const options = paginationRowsPerPageOptions.map((size) => ({ value: size, label: String(size) }));
  const changePage = (page) => onChangePage(Math.max(1, Math.min(pageCount, page)), rowCount);

  return (
    <div className="sa-custom-pagination" aria-label="Table pagination">
      <div className="sa-page-size-label"><span>Rows per page</span><TenantSelect compact value={rowsPerPage} options={options} onChange={(size) => onChangeRowsPerPage(Number(size), currentPage)} label="Rows per page" placement={placement} /></div>
      <span className="sa-page-range" aria-live="polite">{firstRow}–{lastRow} of {rowCount}</span>
      <div className="sa-page-navigation">
        <button type="button" aria-label="First page" disabled={currentPage <= 1} onClick={() => changePage(1)}><ChevronsLeft size={17} /></button>
        <button type="button" aria-label="Previous page" disabled={currentPage <= 1} onClick={() => changePage(currentPage - 1)}><ChevronLeft size={18} /></button>
        <button type="button" aria-label="Next page" disabled={currentPage >= pageCount} onClick={() => changePage(currentPage + 1)}><ChevronRight size={18} /></button>
        <button type="button" aria-label="Last page" disabled={currentPage >= pageCount} onClick={() => changePage(pageCount)}><ChevronsRight size={17} /></button>
      </div>
    </div>
  );
}

export function TaxonomyPagination(props) {
  return <TenantPagination {...props} placement="bottom" />;
}
