import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, CircleAlert, Clock3, Eye, RefreshCw, Play, Users, BookOpen, Award, CircleCheck, Search, X, Filter, ChevronDown, Check, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import BrandLoader from "../../../shared/components/ui/BrandLoader";
import Modal from "../../../shared/components/ui/Modal";
import PageHeader from "../../../shared/components/ui/PageHeader";
import toast from "../../../shared/components/ui/toast";
import { getExamById, getExamErrorMessage, getMyExams, startExam } from "../../exams/services/exams.service";
import "../styles/my-exams.css";

function formatDate(value) {
  if (!value) return "Schedule to be announced";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Schedule to be announced" : date.toLocaleString();
}

function canAttemptExam(exam) {
  return ![false, 0, "false", "0"].includes(typeof exam?.can_attempt === "string" ? exam.can_attempt.toLowerCase() : exam?.can_attempt);
}

function examAttemptAllowance(exam) {
  const extra = Number(exam?.student_extra_attempts) || 0;
  const total = exam?.total_allowed_attempts ?? (
    exam?.max_attempts != null ? Number(exam.max_attempts) + extra : null
  );
  return { extra, total, canAttempt: canAttemptExam(exam), actionRequired: String(exam?.action_required || "").toUpperCase() };
}

function CategoryDropdown({ categories, value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const listId = useId();
  const options = ["", ...categories];
  const selectedLabel = value || "All categories";

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className={`sd-category-dropdown${open ? " is-open" : ""}`} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="sd-category-dropdown__trigger"
        aria-label="Filter exams by category"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}>
        <Filter size={16} aria-hidden="true" />
        <span>{selectedLabel}</span>
        <ChevronDown size={17} aria-hidden="true" />
      </button>
      {open && (
        <div className="sd-category-dropdown__menu" id={listId} role="listbox" aria-label="Exam categories">
          {options.map((category) => {
            const selected = category === value;
            return (
              <button
                type="button"
                role="option"
                aria-selected={selected}
                key={category || "all"}
                onClick={() => {
                  onChange(category);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}>
                <span>{category || "All categories"}</span>
                {selected && <Check size={17} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PageSizeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const listId = useId();
  const options = [6, 9, 12];

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className={`sd-category-dropdown sd-page-size-dropdown${open ? " is-open" : ""}`} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="sd-category-dropdown__trigger"
        aria-label="Cards per page"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}>
        <span>{value}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className="sd-category-dropdown__menu" id={listId} role="listbox" aria-label="Cards per page">
          {options.map((size) => (
            <button
              type="button"
              role="option"
              aria-selected={size === value}
              key={size}
              onClick={() => {
                onChange(size);
                setOpen(false);
                triggerRef.current?.focus();
              }}>
              <span>{size} cards</span>
              {size === value && <Check size={17} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MyExamsPage() {
  const [exams, setExams] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [detail, setDetail] = useState(null);
  const [studentBatchesCount, setStudentBatchesCount] = useState(null);
  const [startingId, setStartingId] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const navigate = useNavigate();
  const retry = useCallback(() => setRefreshKey((value) => value + 1), []);
  const categories = useMemo(
    () => [...new Set(exams.map((exam) => exam.category_name).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [exams],
  );
  const filteredExams = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return exams.filter((exam) => {
      const category = String(exam.category_name || "");
      const batches = (exam.targeted_batches || exam.assigned_batches || [])
        .map((batch) => batch.batch_name || "")
        .join(" ");
      const matchesCategory = !categoryFilter || category === categoryFilter;
      const matchesSearch = !query || [exam.title, exam.description, category, batches]
        .some((value) => String(value || "").toLocaleLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [exams, search, categoryFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredExams.length / pageSize));
  const visibleExams = filteredExams.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, pageSize]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount));
  }, [pageCount]);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setError("");
    getMyExams()
      .then((result) => {
        if (!active) return;
        setExams(result.data);
        setStudentBatchesCount(result.studentBatchesCount);
        setStatus("ready");
      })
      .catch((requestError) => {
        if (!active) return;
        setError(getExamErrorMessage(requestError, requestError.message || "Your exams could not be loaded."));
        setStatus("error");
      });
    return () => { active = false; };
  }, [refreshKey]);

  const showDetails = async (exam) => {
    setDetail({ exam, status: "loading" });
    try {
      const data = await getExamById(exam.exam_id);
      setDetail({ exam, data, status: "ready" });
    } catch (requestError) {
      setDetail({ exam, status: "error", error: getExamErrorMessage(requestError, requestError.message || "Exam details could not be loaded.") });
    }
  };

  const beginExam = async (exam) => {
    if (!canAttemptExam(exam)) {
      toast.warning("No attempts remaining", { description: "You have used all allowed attempts for this exam." });
      return;
    }
    setStartingId(exam.exam_id);
    try {
      const result = await startExam(exam.exam_id);
      const attempt = result?.attempt ?? result?.data?.attempt;
      const attemptId = attempt?.attempt_id;
      if (!attemptId) throw new Error("The exam started, but the response did not include an attempt ID.");
      navigate(`/student/dashboard/exams/${encodeURIComponent(exam.exam_id)}/attempt/${encodeURIComponent(attemptId)}`, { state: { start: result } });
    } catch (requestError) {
      toast.error("Could not start exam", { description: getExamErrorMessage(requestError, requestError.message) });
    } finally {
      setStartingId("");
    }
  };

  return <main className="sd-my-exams">
    <PageHeader eyebrow="YOUR LEARNING" title="My Test" description="Review and take exams assigned to your batches." icon={CalendarDays} actions={<button type="button" className="sd-my-exams__refresh" onClick={retry} disabled={status === "loading"}><RefreshCw size={16} />Refresh</button>} />
    {status === "loading" ? <BrandLoader variant="content" message="Loading your exams…" />
      : status === "error" ? <section className="sd-my-exams__state is-error" role="alert"><CircleAlert size={24} /><h2>Could not load your exams</h2><p>{error}</p><button type="button" className="sd-my-exams__refresh" onClick={retry}>Try again</button></section>
        : exams.length === 0 ? <section className="sd-my-exams__state"><CalendarDays size={26} /><h2>{studentBatchesCount === 0 ? "Your account is not assigned to a batch" : "No exams available"}</h2><p>{studentBatchesCount === 0 ? "Your account is not enrolled in any batch yet. Ask your organization admin to add you to the batch targeted by this exam, then refresh this page." : "Published exams assigned to your batch will appear here."}</p></section>
          : <>
            <section className="sd-my-exams__filters" aria-label="Filter exams">
              <label className="sd-my-exams__search">
                <Search size={17} aria-hidden="true" />
                <span className="sd-sr-only">Search exams</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by exam, category, or batch" />
                {search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")}><X size={16} /></button>}
              </label>
              <CategoryDropdown categories={categories} value={categoryFilter} onChange={setCategoryFilter} />
              <p className="sd-my-exams__filter-count">Showing {filteredExams.length} of {exams.length} exams</p>
            </section>
            {filteredExams.length === 0 ? (
              <section className="sd-my-exams__state sd-my-exams__no-matches">
                <Search size={24} aria-hidden="true" />
                <h2>No matching exams</h2>
                <p>Try another search or category.</p>
                <button type="button" className="sd-my-exams__refresh" onClick={() => { setSearch(""); setCategoryFilter(""); }}>Clear filters</button>
              </section>
            ) : <>
              <section className="sd-my-exams__list" aria-label="Available exams">{visibleExams.map((exam) => {
            const allowance = examAttemptAllowance(exam);
            const hasAttemptInfo = exam.max_attempts != null || exam.total_allowed_attempts != null || exam.student_extra_attempts != null;
            return <article className="sd-my-exams__card" key={exam.exam_id}>
            <div className="sd-my-exams__card-head"><div><span className="sd-my-exams__eyebrow">{exam.category_name || "Exam"}</span><h2>{exam.title}</h2></div><span className="sd-my-exams__status">Published</span></div>
            <p>{exam.description || "No exam description provided."}</p>
            <div className="sd-my-exams__meta"><span><Clock3 size={15} />{exam.duration_minutes} minutes</span><span><Award size={15} />{exam.total_marks} total marks</span><span>{exam.passing_marks} passing marks to pass</span><span><CalendarDays size={15} />{formatDate(exam.starts_at)}</span></div>
            <div className="sd-my-exams__batches">{(exam.targeted_batches || exam.assigned_batches || []).map((batch) => <span key={batch.batch_id}>{batch.batch_name || "Your batch"}</span>)}</div>
            {hasAttemptInfo && <div className="sd-my-exams__attempt-allowance"><span>Allowed attempts <b>{allowance.total ?? "—"}</b></span>{allowance.extra > 0 && <span className="has-extra">{allowance.extra} extra {allowance.extra === 1 ? "attempt" : "attempts"} granted</span>}{(allowance.actionRequired === "RETAKE_TEST" || allowance.extra > 0) && allowance.canAttempt && <strong>Retake available</strong>}</div>}
            <div className="sd-my-exams__actions"><button type="button" className="sd-my-exams__refresh" onClick={() => showDetails(exam)}><Eye size={16} />Details</button><button type="button" className="sd-my-exams__start" onClick={() => beginExam(exam)} disabled={startingId === exam.exam_id || !allowance.canAttempt}><Play size={16} />{startingId === exam.exam_id ? "Starting…" : !allowance.canAttempt ? "No attempts left" : allowance.actionRequired === "RETAKE_TEST" || allowance.extra > 0 ? "Retake test" : "Start test"}</button></div>
          </article>;
          })}</section>
              <nav className="sd-my-exams__pagination" aria-label="Exam list pagination">
                <div className="sd-my-exams__page-size">
                  <span>Cards per page</span>
                  <PageSizeDropdown value={pageSize} onChange={setPageSize} />
                </div>
                <span className="sd-my-exams__page-range">
                  {filteredExams.length ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filteredExams.length)} of ${filteredExams.length}` : "0 exams"}
                </span>
                <div className="sd-my-exams__page-buttons">
                  <button type="button" aria-label="First page" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft size={17} /></button>
                  <button type="button" aria-label="Previous page" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}><ChevronLeft size={17} /></button>
                  <span>Page {currentPage} of {pageCount}</span>
                  <button type="button" aria-label="Next page" onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))} disabled={currentPage >= pageCount}><ChevronRight size={17} /></button>
                  <button type="button" aria-label="Last page" onClick={() => setCurrentPage(pageCount)} disabled={currentPage >= pageCount}><ChevronsRight size={17} /></button>
                </div>
              </nav>
            </>}
          </>}
    {detail && <Modal isOpen onClose={() => setDetail(null)} title={detail.exam.title} description="Exam schedule, instructions, and sections." size="lg" className="sd-my-exams-modal">
      {detail.status === "loading" ? <BrandLoader variant="section" message="Loading exam details…" />
        : detail.status === "error" ? <section className="sd-my-exams__state is-error" role="alert"><CircleAlert size={22} /><p>{detail.error}</p><button type="button" className="sd-my-exams__refresh" onClick={() => showDetails(detail.exam)}>Try again</button></section>
          : <div className="sd-my-exams__detail">
            <div className="sd-my-exams__detail-stats">
              <div><span><Clock3 size={16} /></span><small>Duration</small><strong>{detail.data.duration_minutes} min</strong></div>
              <div><span><Award size={16} /></span><small>Total marks</small><strong>{detail.data.total_marks}</strong></div>
              <div><span><CircleCheck size={16} /></span><small>Passing marks</small><strong>{detail.data.passing_marks}</strong></div>
              <div><span><CalendarDays size={16} /></span><small>Starts</small><strong>{formatDate(detail.data.starts_at)}</strong></div>
            </div>
            {detail.data.instructions && <section className="sd-my-exams__detail-block"><h3>Instructions</h3><p>{detail.data.instructions}</p></section>}
            <section className="sd-my-exams__detail-block"><h3><Users size={16} />Assigned batches</h3><div className="sd-my-exams__batches">{(detail.data.targeted_batches || detail.data.assigned_batches || []).map((batch) => <span key={batch.batch_id}>{batch.batch_name}</span>)}</div></section>
            <section className="sd-my-exams__detail-block"><h3><BookOpen size={16} />Exam sections</h3><ol>{(detail.data.sections || []).map((section, index) => <li key={section.section_id}><span className="sd-my-exams__section-number">{section.section_order || index + 1}</span><span>{section.section_name}{section.total_questions != null && <small>{section.total_questions} questions</small>}</span></li>)}</ol></section>
            <button type="button" className="sd-my-exams__start" disabled={!examAttemptAllowance(detail.exam).canAttempt || startingId === detail.exam.exam_id} onClick={() => { const exam = detail.exam; setDetail(null); beginExam(exam); }}><Play size={16} />{!examAttemptAllowance(detail.exam).canAttempt ? "No attempts left" : examAttemptAllowance(detail.exam).actionRequired === "RETAKE_TEST" ? "Retake test" : "Start test"}</button>
          </div>}
    </Modal>}
  </main>;
}
