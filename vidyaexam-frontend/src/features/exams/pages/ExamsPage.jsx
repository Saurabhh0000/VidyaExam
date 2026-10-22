import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import styled from "styled-components";
import {
  Boxes, Building2, CalendarDays, CircleAlert, ClipboardList, Clock3, Eye, PanelsTopLeft,
  Pencil, Plus, RefreshCw, Search, Trash2, X, LayoutGrid, List, Send,
} from "lucide-react";
import BrandLoader from "../../../shared/components/ui/BrandLoader";
import Modal from "../../../shared/components/ui/Modal";
import PageHeader from "../../../shared/components/ui/PageHeader";
import toast from "../../../shared/components/ui/toast";
import { getCategories } from "../../../shared/services/taxonomy.service";
import { getBatches } from "../../batches/services/batches.service";
import { getQuestions } from "../../question-bank/services/question.service";
import { TenantPagination, TenantSelect } from "../../super-admin/components/TenantControls";
import { MasterWorkspaceStats, MasterWorkspaceTabs } from "../../../shared/components/MasterWorkspaceSection";
import useAuthState from "../../auth/utils/useAuthState";
import { TEACHER_DASHBOARD } from "../../../app/roleRoutes";
import {
  addExamQuestions, addExamSection, assignExamBatches, createExam, deleteExam, getExamById,
  getExamErrorMessage, getExams, publishExam, removeExamQuestion, updateExam,
} from "../services/exams.service";
import "../styles/exams.css";

const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const StyledExamTable = styled(DataTable)`
  .rdt_Table { min-width: 900px; background: transparent; }
  .rdt_TableHeadRow { min-height: 50px; background: #f3f8f7; border-bottom: 1px solid #dce8e6; }
  .rdt_TableCol { justify-content: flex-start; color: #53657b; font-size: .7rem; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
  .rdt_TableRow { min-height: 68px; color: #263b59; border-bottom: 1px solid #edf2f1; }
  .rdt_TableRow:hover { background: #f8fbfa; }
  .rdt_TableCell { align-items: center; justify-content: flex-start; padding: 11px 12px; font-size: .8rem; text-align: left; }
  .rdt_Pagination { min-height: 58px; color: #64748b; border-top: 1px solid #edf2f1; font-size: .78rem; }
  @media (max-width: 640px) { .rdt_TableCell { padding: 9px 8px; font-size: .73rem; } .rdt_TableCol { padding: 0 8px; font-size: .65rem; } }
`;
const asBatchId = (batch) => String(batch?.batch_id ?? batch?.batchId ?? batch?.id ?? "");
const asBatchTenantId = (batch) => String(batch?.tenant_id ?? batch?.tenantId ?? "");
const asBatchLabel = (batch) => batch?.batch_name ?? batch?.name ?? batch?.batch_code ?? "Unnamed batch";
const asCategoryId = (category) => String(category?.category_id ?? category?.id ?? "");
const asCategoryLabel = (category) => category?.category_name ?? category?.name ?? "Unnamed category";
const asQuestionId = (question) => String(question?.question_id ?? question?.id ?? "");
const getSectionQuestions = (section, exam) => {
  const nested = section?.questions ?? section?.question_mappings ?? section?.exam_questions ?? [];
  if (nested.length) return nested;
  return (exam?.questions || []).filter((entry) => String(entry.section_id ?? entry.section?.section_id ?? "") === String(section?.section_id ?? ""));
};
const emptyForm = () => ({
  title: "", description: "", category_id: "", duration_minutes: "60", passing_marks: "",
  total_marks: "", instructions: "", starts_at: "", ends_at: "", batch_ids: [], status: "DRAFT",
});

function localDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function isoDateTime(value) {
  return value ? new Date(value).toISOString() : null;
}

function formatDate(value) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not scheduled" : date.toLocaleString();
}

function ExamsWorkspaceNavigation({ count, batchCount, sectionCount, action, teacherMode = false }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const base = pathname.match(/^(.*\/master)(?:\/.*)?$/)?.[1] || pathname;
  const items = [
    ...(!teacherMode ? [{ key: "batches", label: "Batches", Icon: Boxes, count: batchCount }] : []),
    { key: "exams", label: "Exams", Icon: ClipboardList, count },
    { key: "sections", label: "Sections", Icon: PanelsTopLeft, count: sectionCount },
  ];
  return <div className="sa-taxonomy-tabs-header master-workspace__tabs-header">
      <nav className="sa-taxonomy-tabs" aria-label="Master data sections">
        {items.map(({ key, label, Icon, count: itemCount }) => <button key={key} type="button" className={`sa-tax-tab-btn${key === "exams" ? " is-active" : ""}`} onClick={() => navigate(teacherMode ? `${TEACHER_DASHBOARD}/exams${key === "sections" ? "/sections" : ""}` : `${base}/${key}`)} aria-current={key === "exams" ? "page" : undefined}><Icon size={16} aria-hidden="true" />{label}<span className="sa-tax-tab-badge">{itemCount}</span></button>)}
      </nav>
      {action && <div className="sa-taxonomy-header-actions">{action}</div>}
    </div>;
}

function ExamForm({ initial, categories, batches, editing, submitting, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => initial ? {
    title: initial.title || "",
    description: initial.description || "",
    category_id: String(initial.category_id || ""),
    duration_minutes: String(initial.duration_minutes ?? 60),
    passing_marks: String(initial.passing_marks ?? ""),
    total_marks: String(initial.total_marks ?? ""),
    instructions: initial.instructions || "",
    starts_at: localDateTime(initial.starts_at),
    ends_at: localDateTime(initial.ends_at),
    batch_ids: (initial.targeted_batches || []).map((batch) => String(batch.batch_id)),
    status: initial.status || "DRAFT",
  } : emptyForm());
  const [error, setError] = useState("");
  const [batchSearch, setBatchSearch] = useState("");
  const visibleBatches = batches.filter((batch) => asBatchLabel(batch).toLowerCase().includes(batchSearch.trim().toLowerCase()) || String(batch.batch_code || "").toLowerCase().includes(batchSearch.trim().toLowerCase()));
  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const toggleBatch = (id) => setForm((current) => ({
    ...current,
    batch_ids: current.batch_ids.includes(id) ? current.batch_ids.filter((item) => item !== id) : [...current.batch_ids, id],
  }));

  const submit = (event) => {
    event.preventDefault();
    const duration = Number(form.duration_minutes);
    const totalMarks = Number(form.total_marks);
    const passingMarks = Number(form.passing_marks);
    const start = form.starts_at ? new Date(form.starts_at) : null;
    const end = form.ends_at ? new Date(form.ends_at) : null;
    const issues = [];
    if (!form.title.trim()) issues.push("Enter an exam title.");
    if (!form.category_id || !categories.some((item) => asCategoryId(item) === form.category_id)) issues.push("Select an exam category.");
    if (!Number.isFinite(duration) || duration < 1) issues.push("Duration must be at least one minute.");
    if (!Number.isFinite(totalMarks) || totalMarks <= 0) issues.push("Total marks must be greater than zero.");
    if (form.passing_marks === "" || !Number.isFinite(passingMarks) || passingMarks < 0) issues.push("Enter valid passing marks.");
    else if (Number.isFinite(totalMarks) && passingMarks > totalMarks) issues.push("Passing marks cannot exceed total marks.");
    if (!editing && !form.batch_ids.length) issues.push("Select at least one target batch.");
    if (form.starts_at && (!start || Number.isNaN(start.getTime()))) issues.push("Enter a valid start date and time.");
    if (form.ends_at && (!end || Number.isNaN(end.getTime()))) issues.push("Enter a valid end date and time.");
    if (start && end && end <= start) issues.push("The end date and time must be after the start.");
    if (!STATUSES.includes(form.status)) issues.push("Select a valid exam status.");
    if (issues.length) {
      setError(issues[0]);
      toast.warning("Review the exam details", { description: issues.slice(0, 3).join(" ") });
      return;
    }
    setError("");
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category_id: form.category_id,
      duration_minutes: duration,
      passing_marks: passingMarks,
      instructions: form.instructions.trim(),
      starts_at: isoDateTime(form.starts_at),
      ends_at: isoDateTime(form.ends_at),
      ...(editing ? { status: form.status } : { total_marks: totalMarks }),
      batch_ids: form.batch_ids,
    };
    onSubmit(payload);
  };

  return <form className="ve-exam-form" onSubmit={submit} noValidate>
    <div className="ve-exam-form-grid">
      <label className="ve-exam-field ve-exam-field--wide"><span>Exam title <b>*</b></span><input maxLength={180} value={form.title} onChange={(event) => setField("title", event.target.value)} placeholder="e.g. Class 1 Midterm Mathematics" /></label>
      <label className="ve-exam-field"><span>Category <b>*</b></span><select value={form.category_id} onChange={(event) => setField("category_id", event.target.value)}><option value="">Select a category</option>{categories.map((item) => <option key={asCategoryId(item)} value={asCategoryId(item)}>{asCategoryLabel(item)}</option>)}</select></label>
      <label className="ve-exam-field"><span>Duration in minutes <b>*</b></span><input type="number" min="1" step="1" value={form.duration_minutes} onChange={(event) => setField("duration_minutes", event.target.value)} /></label>
      <label className="ve-exam-field"><span>Total marks <b>*</b></span><input type="number" min="0.01" step="any" value={form.total_marks} onChange={(event) => setField("total_marks", event.target.value)} disabled={editing} /></label>
      <label className="ve-exam-field"><span>Passing marks <b>*</b></span><input type="number" min="0" step="any" value={form.passing_marks} onChange={(event) => setField("passing_marks", event.target.value)} /></label>
      <label className="ve-exam-field"><span>Starts at</span><input type="datetime-local" value={form.starts_at} onChange={(event) => setField("starts_at", event.target.value)} /></label>
      <label className="ve-exam-field"><span>Ends at</span><input type="datetime-local" value={form.ends_at} onChange={(event) => setField("ends_at", event.target.value)} /></label>
      {editing && <label className="ve-exam-field"><span>Status</span><select value={form.status} onChange={(event) => setField("status", event.target.value)}>{STATUSES.map((value) => <option key={value} value={value}>{value.charAt(0) + value.slice(1).toLowerCase()}</option>)}</select></label>}
      <label className="ve-exam-field ve-exam-field--wide"><span>Description</span><textarea rows="2" maxLength={2000} value={form.description} onChange={(event) => setField("description", event.target.value)} placeholder="What this exam covers" /></label>
      <label className="ve-exam-field ve-exam-field--wide"><span>Instructions</span><textarea rows="3" maxLength={4000} value={form.instructions} onChange={(event) => setField("instructions", event.target.value)} placeholder="Instructions students should read before starting" /></label>
      <fieldset className="ve-exam-batch-picker ve-exam-field--wide">
        <legend>{editing ? "Assign to batches" : <>Target batches <b>*</b></>}</legend>
        <label className="ve-exam-batch-search"><Search size={16} aria-hidden="true" /><input value={batchSearch} onChange={(event) => setBatchSearch(event.target.value)} placeholder="Search batches" /></label>
        <div className="ve-exam-batch-list">
          {visibleBatches.map((batch) => {
            const id = asBatchId(batch);
            return <label key={id} className="ve-exam-batch-option"><input type="checkbox" checked={form.batch_ids.includes(id)} onChange={() => toggleBatch(id)} /><span>{asBatchLabel(batch)}{batch.batch_code && <small>{batch.batch_code}</small>}</span></label>;
          })}
          {!visibleBatches.length && <p>{batches.length ? "No batches match your search." : "No batches are available for the active organization."}</p>}
        </div>
        <small>{form.batch_ids.length ? `${form.batch_ids.length} batch${form.batch_ids.length === 1 ? "" : "es"} selected.` : "No batches selected: this exam is available to all students in your organization."}</small>
      </fieldset>
    </div>
    {error && <p className="ve-exam-form-error" role="alert">{error}</p>}
    <div className="ve-exam-modal-actions"><button type="button" className="ve-exam-button is-secondary" onClick={onCancel} disabled={submitting}>Cancel</button><button type="submit" className="ve-exam-button is-primary" disabled={submitting}>{submitting ? "Saving…" : editing ? "Save changes" : "Create exam"}</button></div>
  </form>;
}

function AttachQuestionsModal({ exam, tenantId, batches, onCancel, onAttach, attaching }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [batchFilter, setBatchFilter] = useState("ALL");
  const [sectionId, setSectionId] = useState(String(exam.initialSectionId || exam.sections?.[0]?.section_id || ""));
  const [selectedIds, setSelectedIds] = useState([]);
  const [marks, setMarks] = useState("1");
  const [negativeMarks, setNegativeMarks] = useState("0");
  const [validation, setValidation] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    getQuestions(tenantId, { signal: controller.signal })
      .then((result) => setQuestions(result.data || []))
      .catch((error) => {
        if (error?.name !== "CanceledError") setLoadError(getExamErrorMessage(error, "Questions could not be loaded."));
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [tenantId]);

  const attachedIds = new Set((exam.sections || []).flatMap((section) => getSectionQuestions(section, exam).map((item) => asQuestionId(item?.question || item))));
  const visibleQuestions = questions.filter((question) => {
    const batchId = String(question.batch_id ?? question.batchId ?? "");
    const matchesBatch = batchFilter === "ALL" || batchId === batchFilter;
    const text = `${question.question_text || ""} ${question.topic_name || ""} ${question.subject_name || ""}`.toLowerCase();
    return matchesBatch && !attachedIds.has(asQuestionId(question)) && (!query.trim() || text.includes(query.trim().toLowerCase()));
  });
  const toggleQuestion = (questionId) => setSelectedIds((current) => current.includes(questionId) ? current.filter((id) => id !== questionId) : [...current, questionId]);
  const submit = () => {
    const parsedMarks = Number(marks);
    const parsedNegativeMarks = Number(negativeMarks);
    if (!sectionId) return setValidation("Select an exam section.");
    if (!selectedIds.length) return setValidation("Select at least one question.");
    if (!Number.isFinite(parsedMarks) || parsedMarks <= 0) return setValidation("Marks must be greater than zero.");
    if (!Number.isFinite(parsedNegativeMarks) || parsedNegativeMarks < 0) return setValidation("Negative marks cannot be less than zero.");
    setValidation("");
    onAttach({ section_id: sectionId, question_ids: selectedIds, marks: parsedMarks, negative_marks: parsedNegativeMarks });
  };

  return <div className="ve-exam-attach-questions">
    <div className="ve-exam-question-toolbar">
      <label className="ve-exam-search"><Search size={16} /><span className="ve-exam-sr-only">Search questions</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search question or topic" /></label>
      <label className="ve-exam-field"><span>Batch filter</span><select value={batchFilter} onChange={(event) => setBatchFilter(event.target.value)}><option value="ALL">All batches</option>{batches.map((batch) => <option key={asBatchId(batch)} value={asBatchId(batch)}>{asBatchLabel(batch)}</option>)}</select></label>
      <label className="ve-exam-field"><span>Exam section</span><select value={sectionId} onChange={(event) => setSectionId(event.target.value)}><option value="">Select a section</option>{(exam.sections || []).map((section) => <option key={section.section_id} value={section.section_id}>{section.section_name}</option>)}</select></label>
    </div>
    <div className="ve-exam-attach-scoring"><label className="ve-exam-field"><span>Marks per question</span><input type="number" min="0.01" step="any" value={marks} onChange={(event) => setMarks(event.target.value)} /></label><label className="ve-exam-field"><span>Negative marks</span><input type="number" min="0" step="any" value={negativeMarks} onChange={(event) => setNegativeMarks(event.target.value)} /></label><span>{selectedIds.length} selected</span></div>
    {loading ? <BrandLoader variant="section" message="Loading question bank…" /> : loadError ? <div className="ve-exam-state is-error"><CircleAlert size={22} /><p>{loadError}</p></div> : <div className="ve-exam-question-list">{visibleQuestions.map((question) => {
      const id = asQuestionId(question);
      return <label className="ve-exam-question-option" key={id}><input type="checkbox" checked={selectedIds.includes(id)} onChange={() => toggleQuestion(id)} /><span><strong>{question.question_text || "Question text unavailable"}</strong><small>{[question.batch_name, question.topic_name, question.question_type?.replaceAll("_", " ")].filter(Boolean).join(" · ")}</small></span></label>;
    })}{!visibleQuestions.length && <p className="ve-exam-question-empty">No available questions match this filter.</p>}</div>}
    {validation && <p className="ve-exam-form-error" role="alert">{validation}</p>}
    <div className="ve-exam-modal-actions"><button type="button" className="ve-exam-button is-secondary" onClick={onCancel} disabled={attaching}>Cancel</button><button type="button" className="ve-exam-button is-primary" onClick={submit} disabled={attaching || loading || Boolean(loadError)}>{attaching ? "Attaching…" : `Attach ${selectedIds.length || "selected"} question${selectedIds.length === 1 ? "" : "s"}`}</button></div>
  </div>;
}

export function ExamSectionsPage() {
  const { user } = useAuthState();
  const teacherMode = String(user?.role || "").toUpperCase() === "TEACHER";
  const [examDetails, setExamDetails] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [examId, setExamId] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [duration, setDuration] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [examFilter, setExamFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setError("");
    getExams({ signal: controller.signal })
      .then(async (result) => {
        const loaded = await Promise.allSettled(result.data.map((exam) => getExamById(exam.exam_id, { signal: controller.signal })));
        if (controller.signal.aborted) return;
        const examsWithDetails = loaded.flatMap((item, index) => item.status === "fulfilled" ? [{ ...result.data[index], ...item.value }] : []);
        setExamDetails(examsWithDetails);
        setStatus(loaded.some((item) => item.status === "fulfilled") || !result.data.length ? "ready" : "error");
        if (loaded.length && loaded.every((item) => item.status === "rejected")) setError("Exam sections could not be loaded.");
      })
      .catch((requestError) => {
        if (requestError?.name === "CanceledError") return;
        setError(getExamErrorMessage(requestError, "Exams could not be loaded."));
        setStatus("error");
      });
    return () => controller.abort();
  }, [refreshKey]);

  const sections = examDetails.flatMap((exam) => (exam.sections || []).map((section) => ({ ...section, exam_title: exam.title, exam_id: exam.exam_id })));
  const filteredSections = sections.filter((section) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [section.section_name, section.exam_title].some((value) => String(value || "").toLowerCase().includes(query));
    return matchesSearch && (examFilter === "ALL" || String(section.exam_id) === examFilter);
  });
  const sectionPageCount = Math.max(1, Math.ceil(filteredSections.length / rowsPerPage));
  const visibleSections = filteredSections.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  useEffect(() => setCurrentPage(1), [search, examFilter, rowsPerPage]);
  useEffect(() => setCurrentPage((page) => Math.min(page, sectionPageCount)), [sectionPageCount]);
  const selectedExam = examDetails.find((exam) => String(exam.exam_id) === String(examId));
  const columns = useMemo(() => [
    { name: "Section", selector: (row) => row.section_name || "", sortable: true, grow: 1.2, cell: (row) => <div className="ve-exam-table-name"><span className="ve-exam-table-icon"><PanelsTopLeft size={16} aria-hidden="true" /></span><span><strong>{row.section_name || "Unnamed section"}</strong><small>Section {row.section_order ?? "—"}</small></span></div> },
    { name: "Exam", selector: (row) => row.exam_title || "", sortable: true, grow: 1.4 },
    { name: "Duration", selector: (row) => Number(row.duration_minutes) || 0, sortable: true, width: "145px", cell: (row) => row.duration_minutes ? `${row.duration_minutes} min` : "No time limit" },
    { name: "Questions", selector: (row) => row.total_questions ?? getSectionQuestions(row).length, sortable: true, width: "125px", cell: (row) => row.total_questions ?? getSectionQuestions(row).length },
  ], []);

  const createSection = async (event) => {
    event.preventDefault();
    const name = sectionName.trim();
    const sectionDuration = duration === "" ? null : Number(duration);
    if (!examId || !selectedExam) return toast.warning("Select an exam first.");
    if (!name) return toast.warning("Enter a section name.");
    if (sectionDuration !== null && (!Number.isFinite(sectionDuration) || sectionDuration < 1)) return toast.warning("Duration must be at least one minute.");
    setSubmitting(true);
    try {
      await addExamSection(examId, {
        section_name: name,
        section_order: (selectedExam.sections || []).length + 1,
        ...(sectionDuration !== null ? { duration_minutes: sectionDuration } : {}),
      });
      toast.success("Exam section added.");
      setIsModalOpen(false);
      setSectionName("");
      setDuration("");
      setRefreshKey((value) => value + 1);
    } catch (requestError) {
      toast.error("Unable to add section", { description: getExamErrorMessage(requestError, requestError.message) });
    } finally {
      setSubmitting(false);
    }
  };

  return <main className={`ve-exams-page sa-taxonomy-section sa-master-section ve-exam-sections-page${teacherMode ? " teacher-workspace-page" : ""}`}>
    <PageHeader eyebrow="MASTER DATA" title="Sections" description="Create and organize sections inside exams." icon={PanelsTopLeft} />
    <MasterWorkspaceStats page="sections" examCount={examDetails.length} sectionCount={sections.length} />
    <section className="ve-exam-panel sa-content-panel sa-taxonomy-panel" aria-label="Exam sections">
      <MasterWorkspaceTabs page="sections" examCount={examDetails.length} sectionCount={sections.length} action={<button type="button" className="ve-exam-button is-primary" onClick={() => setIsModalOpen(true)} disabled={!examDetails.length}><Plus size={16} />Add section</button>} />
      <div className="ve-exam-toolbar sa-tenants-toolbar ve-exam-sections-toolbar">
        <div className="ve-exam-search"><Search size={17} /><label className="ve-exam-sr-only" htmlFor="ve-sections-search">Search exam sections</label><input id="ve-sections-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by section or exam name" />{search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")}><X size={16} /></button>}</div>
        <div className="ve-exam-section-filter"><span>Exam</span><TenantSelect value={examFilter} options={[{ value: "ALL", label: "All exams" }, ...examDetails.map((exam) => ({ value: exam.exam_id, label: exam.title || "Untitled exam" }))]} onChange={setExamFilter} label="Filter sections by exam" className="ve-exam-exam-filter" portalOptions /></div>
        <div className="ve-exam-view-toggle" role="group" aria-label="Section display mode"><button type="button" className={viewMode === "table" ? "is-active" : ""} onClick={() => setViewMode("table")} aria-label="List view" aria-pressed={viewMode === "table"}><List size={17} /></button><button type="button" className={viewMode === "grid" ? "is-active" : ""} onClick={() => setViewMode("grid")} aria-label="Grid view" aria-pressed={viewMode === "grid"}><LayoutGrid size={17} /></button></div>
        <button type="button" className="ve-exam-icon-button" onClick={() => setRefreshKey((value) => value + 1)} disabled={status === "loading"} aria-label="Refresh sections"><RefreshCw size={17} /></button>
      </div>
      {status === "loading" ? <BrandLoader variant="section" message="Loading exam sections…" /> : status === "error" ? <div className="ve-exam-state is-error"><CircleAlert size={22} /><h2>Sections could not be loaded</h2><p>{error}</p><button type="button" className="ve-exam-button is-secondary" onClick={() => setRefreshKey((value) => value + 1)}>Try again</button></div> : filteredSections.length ? viewMode === "table" ? <div className="ve-exam-table-wrap"><StyledExamTable key={`${refreshKey}-${examFilter}-${search}`} keyField="section_id" columns={columns} data={filteredSections} pagination paginationPerPage={10} paginationRowsPerPageOptions={[10, 20, 50]} paginationComponent={(paginationProps) => <TenantPagination {...paginationProps} portalMenu className="ve-exam-pagination" />} responsive persistTableHead highlightOnHover ariaLabel="Exam sections directory" /></div> : <div className="ve-exam-sections-grid">{visibleSections.map((section) => <article className="ve-exam-section-tile" key={section.section_id}><div className="ve-exam-section-tile-heading"><span className="ve-exam-table-icon"><PanelsTopLeft size={16} /></span><span className="ve-exam-section-order">Section {section.section_order ?? "—"}</span></div><h2>{section.section_name || "Unnamed section"}</h2><p>{section.exam_title || "Exam unavailable"}</p><div className="ve-exam-section-tile-meta"><span>{section.duration_minutes ? `${section.duration_minutes} minutes` : "No time limit"}</span><span>{section.total_questions ?? getSectionQuestions(section).length} questions</span></div></article>)}</div> : <div className="ve-exam-state"><PanelsTopLeft size={24} /><h2>{sections.length ? "No sections match these filters" : "No sections found"}</h2><p>{sections.length ? "Try a different search or exam filter." : "Create an exam first, then add additional sections here."}</p></div>}
      {status === "ready" && filteredSections.length > 0 && viewMode === "grid" && <TenantPagination rowsPerPage={rowsPerPage} rowCount={filteredSections.length} currentPage={currentPage} onChangePage={setCurrentPage} onChangeRowsPerPage={(size) => setRowsPerPage(size)} paginationRowsPerPageOptions={[10, 20, 50]} portalMenu className="ve-exam-pagination" />}
      <footer className="ve-exam-footer"><span>{filteredSections.length} matching</span><span>{sections.length} total sections</span></footer>
    </section>
    {isModalOpen && <Modal isOpen onClose={() => !submitting && setIsModalOpen(false)} title="Add exam section" description="Choose an exam and add a section to it." size="sm" className="ve-exam-modal" closeOnEscape={!submitting} closeOnOverlay={!submitting}>
      <form className="ve-exam-section-form" onSubmit={createSection}><label className="ve-exam-field"><span>Exam <b>*</b></span><select value={examId} onChange={(event) => setExamId(event.target.value)} required><option value="">Select an exam</option>{examDetails.map((exam) => <option key={exam.exam_id} value={exam.exam_id}>{exam.title}</option>)}</select></label><label className="ve-exam-field"><span>Section name <b>*</b></span><input autoFocus maxLength={100} value={sectionName} onChange={(event) => setSectionName(event.target.value)} placeholder="e.g. Section B: Chemistry" required /></label><label className="ve-exam-field"><span>Duration in minutes</span><input type="number" min="1" step="1" value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="Optional" /></label><div className="ve-exam-modal-actions"><button type="button" className="ve-exam-button is-secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>Cancel</button><button type="submit" className="ve-exam-button is-primary" disabled={submitting}>{submitting ? "Adding…" : "Add section"}</button></div></form>
    </Modal>}
  </main>;
}

export default function ExamsPage() {
  const { user } = useAuthState();
  const role = String(user?.role || "").toUpperCase();
  const teacherMode = role === "TEACHER";
  const isSuperAdmin = role === "SUPER_ADMIN";
  const tenantId = user?.activeTenantId ?? user?.active_tenant_id ?? null;
  const [exams, setExams] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [batches, setBatches] = useState([]);
  const [batchDirectoryCount, setBatchDirectoryCount] = useState(0);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [categoriesStatus, setCategoriesStatus] = useState("loading");
  const [batchesStatus, setBatchesStatus] = useState("loading");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [refreshKey, setRefreshKey] = useState(0);
  const [formState, setFormState] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState(null);
  const [attachTarget, setAttachTarget] = useState(null);
  const [attachingQuestions, setAttachingQuestions] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const retry = useCallback(() => setRefreshKey((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setError("");
    getExams({ signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setExams(result.data);
        setTotal(result.total);
        setStatus("ready");
      })
      .catch((requestError) => {
        if (requestError?.name === "CanceledError") return;
        setError(getExamErrorMessage(requestError, requestError.message || "Exams could not be loaded."));
        setStatus("error");
      });
    return () => controller.abort();
  }, [refreshKey]);

  useEffect(() => {
    const controller = new AbortController();
    setCategoriesStatus("loading");
    setBatchesStatus("loading");
    Promise.allSettled([getCategories({ signal: controller.signal }), getBatches({ signal: controller.signal })])
      .then(([categoryResult, batchResult]) => {
        if (controller.signal.aborted) return;
        if (categoryResult.status === "fulfilled") {
          setCategories(categoryResult.value.data || []);
          setCategoriesStatus("ready");
        } else {
          setCategoriesStatus("error");
          toast.error("Could not load exam categories", { description: categoryResult.reason?.message || "Try again later." });
        }
        if (batchResult.status === "fulfilled") {
          const all = batchResult.value.data || [];
          setBatchDirectoryCount(Number.isFinite(Number(batchResult.value.total)) ? Number(batchResult.value.total) : all.length);
          const scoped = tenantId ? all.filter((batch) => asBatchTenantId(batch) === String(tenantId)) : [];
          setBatches(scoped);
          setBatchesStatus("ready");
        } else {
          setBatchesStatus("error");
          toast.error("Could not load target batches", { description: getExamErrorMessage(batchResult.reason, batchResult.reason?.message || "Try again later.") });
        }
      });
    return () => controller.abort();
  }, [tenantId, refreshKey]);

  const filtered = useMemo(() => exams.filter((exam) => {
    const matchesSearch = !search.trim() || [exam.title, exam.description, exam.category_name, exam.tenant_name, ...(exam.targeted_batches || []).map((batch) => batch.batch_name)].some((value) => String(value || "").toLowerCase().includes(search.trim().toLowerCase()));
    return matchesSearch && (statusFilter === "ALL" || String(exam.status || "").toUpperCase() === statusFilter);
  }), [exams, search, statusFilter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageItems = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  useEffect(() => setCurrentPage((page) => Math.min(page, pageCount)), [pageCount]);
  useEffect(() => setCurrentPage(1), [search, statusFilter, rowsPerPage]);

  const submit = async (payload) => {
    setSubmitting(true);
    try {
      if (formState?.mode === "edit") {
        const { batch_ids: batchIds = [], ...examPayload } = payload;
        await updateExam(formState.exam.exam_id, examPayload);
        await assignExamBatches(formState.exam.exam_id, batchIds);
        toast.success("Exam and target batches updated successfully.");
      } else {
        const created = await createExam(payload);
        const createdData = created?.data?.data ?? created?.data ?? created;
        const createdExamId = createdData?.exam_id ?? createdData?.id;
        if (payload.batch_ids?.length && !createdExamId) {
          throw new Error("The exam was created, but its ID was missing from the response, so target batches could not be confirmed. Edit the exam and save its batch assignments.");
        }
        if (payload.batch_ids?.length) {
          try {
            await assignExamBatches(createdExamId, payload.batch_ids);
          } catch (assignmentError) {
            setFormState(null);
            retry();
            toast.error("Exam created, but batches were not assigned", {
              description: `${getExamErrorMessage(assignmentError, assignmentError.message)} Edit the exam and save its target batches before publishing.`,
            });
            return;
          }
        }
        toast.success("Exam draft created successfully.");
      }
      setFormState(null);
      retry();
    } catch (requestError) {
      toast.error(formState?.mode === "edit" ? "Unable to update exam" : "Unable to create exam", { description: getExamErrorMessage(requestError, requestError.message) });
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = async (exam) => {
    setDetail({ mode: "edit-loading", exam });
    try {
      const result = await getExamById(exam.exam_id);
      setDetail(null);
      setFormState({ mode: "edit", exam: result });
    } catch (requestError) {
      setDetail(null);
      toast.error("Unable to load exam for editing", { description: getExamErrorMessage(requestError, requestError.message) });
    }
  };

  const openDetails = async (exam) => {
    setDetail({ mode: "loading", exam, data: null });
    try {
      const result = await getExamById(exam.exam_id);
      setDetail({ mode: "ready", exam, data: result });
    } catch (requestError) {
      setDetail({ mode: "error", exam, error: getExamErrorMessage(requestError, requestError.message) });
    }
  };

  const attachSelectedQuestions = async (payload) => {
    if (!attachTarget) return;
    setAttachingQuestions(true);
    try {
      await addExamQuestions(attachTarget.exam_id, payload);
      toast.success("Questions attached to the section.");
      const exam = attachTarget;
      setAttachTarget(null);
      openDetails(exam);
      retry();
    } catch (requestError) {
      toast.error("Unable to attach questions", { description: getExamErrorMessage(requestError, requestError.message) });
    } finally {
      setAttachingQuestions(false);
    }
  };

  const removeAttachedQuestion = async (exam, questionId) => {
    try {
      await removeExamQuestion(exam.exam_id, questionId);
      toast.success("Question removed from the exam.");
      openDetails(exam);
      retry();
    } catch (requestError) {
      toast.error("Unable to remove question", { description: getExamErrorMessage(requestError, requestError.message) });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteExam(deleteTarget.exam_id);
      toast.success("Exam deleted successfully.");
      setDeleteTarget(null);
      retry();
    } catch (requestError) {
      toast.error("Unable to delete exam", { description: getExamErrorMessage(requestError, requestError.message) });
    } finally {
      setDeleting(false);
    }
  };

  const handlePublish = async (exam) => {
    try {
      await publishExam(exam.exam_id);
      toast.success("Exam published. Students can now see it.");
      retry();
    } catch (requestError) {
      toast.error("Unable to publish exam", { description: getExamErrorMessage(requestError, requestError.message) });
    }
  };

  const canCreate = Boolean(tenantId) && categoriesStatus === "ready" && batchesStatus === "ready";
  const examColumns = useMemo(() => [
    { name: "Exam", selector: (exam) => exam.title || "", sortable: true, grow: 1.4, cell: (exam) => <div className="ve-exam-table-name"><span className="ve-exam-table-icon"><ClipboardList size={16} aria-hidden="true" /></span><span><strong>{exam.title || "Untitled exam"}</strong>{isSuperAdmin && exam.tenant_name && <small>{exam.tenant_name}</small>}</span></div> },
    { name: "Category", selector: (exam) => exam.category_name || "", sortable: true, grow: 1 },
    { name: "Target batches", selector: (exam) => (exam.targeted_batches || []).map((batch) => batch.batch_name).join(", "), grow: 1.2, cell: (exam) => <div className="ve-exam-card__batches">{(exam.targeted_batches || []).map((batch) => <span key={batch.batch_id}>{batch.batch_name || "Assigned batch"}</span>)}{!exam.targeted_batches?.length && <span>No assigned batches</span>}</div> },
    { name: "Duration", selector: (exam) => Number(exam.duration_minutes) || 0, sortable: true, width: "145px", cell: (exam) => `${exam.duration_minutes ?? "—"} min` },
    { name: "Marks", selector: (exam) => Number(exam.total_marks) || 0, sortable: true, width: "125px", cell: (exam) => <span>{exam.total_marks ?? "—"} total<small className="ve-exam-table-subtext">{exam.passing_marks ?? "—"} to pass</small></span> },
    { name: "Schedule", selector: (exam) => exam.starts_at || "", sortable: true, width: "155px", cell: (exam) => <span className="ve-exam-table-schedule"><CalendarDays size={14} aria-hidden="true" />{formatDate(exam.starts_at)}</span> },
    { name: "Status", selector: (exam) => exam.status || "", sortable: true, width: "125px", cell: (exam) => <span className={`ve-exam-status is-${String(exam.status || "draft").toLowerCase()}`}>{exam.status || "DRAFT"}</span> },
    { name: "Actions", button: true, width: "154px", cell: (exam) => <div className="ve-exam-table-actions"><button type="button" onClick={() => openDetails(exam)} aria-label={`View ${exam.title}`} title="View details"><Eye size={14} /></button><button type="button" onClick={() => openEdit(exam)} aria-label={`Edit ${exam.title}`} title="Edit exam"><Pencil size={14} /></button>{String(exam.status).toUpperCase() === "DRAFT" && <button type="button" onClick={() => handlePublish(exam)} aria-label={`Publish ${exam.title}`} title="Publish exam"><Send size={14} /></button>}<button type="button" className="is-danger" onClick={() => setDeleteTarget(exam)} aria-label={`Delete ${exam.title}`} title="Delete exam"><Trash2 size={14} /></button></div> },
  ], [isSuperAdmin, openDetails, openEdit, handlePublish]);
  return <main className={`ve-exams-page sa-taxonomy-section sa-master-section${teacherMode ? " teacher-workspace-page" : ""}`}>
    <PageHeader eyebrow="MASTER DATA" title="Exams" description={isSuperAdmin ? "Create and manage exams for the selected organization." : "Create and manage exams for your organization."} icon={ClipboardList} />
    <section className="sa-tenants-stats-bar master-workspace__stats" aria-label="Exam overview"><article className="sa-tenant-stat-card master-workspace__stat is-selected-card"><span className="sa-tstat-icon is-navy"><ClipboardList size={20} aria-hidden="true" /></span><span className="sa-tstat-copy"><span className="sa-tstat-label">Exams</span><strong className="sa-tstat-value">{status === "ready" ? total : "—"}</strong><span className="sa-tstat-meta">Total exams</span></span></article><article className="sa-tenant-stat-card master-workspace__stat"><span className="sa-tstat-icon is-teal"><ClipboardList size={20} aria-hidden="true" /></span><span className="sa-tstat-copy"><span className="sa-tstat-label">Published</span><strong className="sa-tstat-value">{status === "ready" ? exams.filter((exam) => exam.status === "PUBLISHED").length : "—"}</strong><span className="sa-tstat-meta">Available to learners</span></span></article><article className="sa-tenant-stat-card master-workspace__stat"><span className="sa-tstat-icon is-amber"><Clock3 size={20} aria-hidden="true" /></span><span className="sa-tstat-copy"><span className="sa-tstat-label">Drafts</span><strong className="sa-tstat-value">{status === "ready" ? exams.filter((exam) => exam.status === "DRAFT").length : "—"}</strong><span className="sa-tstat-meta">In preparation</span></span></article></section>
    {!tenantId && <div className="ve-exam-context-note"><CircleAlert size={18} /><span>{isSuperAdmin ? "Select an active organization before creating an exam. The list still shows exams available to your account." : "Select your active organization to create exams."}</span></div>}
    <section className="ve-exam-panel sa-content-panel sa-taxonomy-panel" aria-label="Exam directory">
      <ExamsWorkspaceNavigation count={status === "ready" ? total : 0} batchCount={batchDirectoryCount} sectionCount={exams.reduce((sum, exam) => sum + (Number(exam.total_sections) || 0), 0)} teacherMode={teacherMode} action={!isSuperAdmin && <button type="button" className="ve-exam-button is-primary" onClick={() => setFormState({ mode: "create" })} disabled={!canCreate}><Plus size={16} />Create exam</button>} />
      <div className="ve-exam-toolbar">
        <div className="ve-exam-search"><Search size={17} /><label className="ve-exam-sr-only" htmlFor="ve-exam-search-input">Search exams</label><input id="ve-exam-search-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by exam, category, or batch" />{search && <button type="button" onClick={() => setSearch("")} aria-label="Clear exam search"><X size={16} /></button>}</div>
        <div className="ve-exam-filter"><span>Status</span><TenantSelect value={statusFilter} options={[{ value: "ALL", label: "All statuses" }, ...STATUSES.map((value) => ({ value, label: value.charAt(0) + value.slice(1).toLowerCase() }))]} onChange={setStatusFilter} label="Filter exams by status" className="ve-exam-status-filter" portalOptions /></div>
        <div className="ve-exam-view-toggle" role="group" aria-label="Exam display mode"><button type="button" className={viewMode === "table" ? "is-active" : ""} aria-label="List view" aria-pressed={viewMode === "table"} onClick={() => setViewMode("table")}><List size={17} /></button><button type="button" className={viewMode === "grid" ? "is-active" : ""} aria-label="Grid view" aria-pressed={viewMode === "grid"} onClick={() => setViewMode("grid")}><LayoutGrid size={17} /></button></div>
        <button type="button" className="ve-exam-icon-button" onClick={retry} disabled={status === "loading"} aria-label="Refresh exams"><RefreshCw size={17} /></button>
      </div>
      {status === "loading" ? <BrandLoader variant="section" message="Loading exams…" />
        : status === "error" ? <div className="ve-exam-state is-error" role="alert"><CircleAlert size={24} /><h2>Could not load exams</h2><p>{error}</p><button type="button" className="ve-exam-button is-secondary" onClick={retry}>Try again</button></div>
          : filtered.length === 0 ? <div className="ve-exam-state"><ClipboardList size={25} /><h2>{exams.length ? "No exams match these filters" : "No exams yet"}</h2><p>{exams.length ? "Try a different search or status." : "Create an exam draft and assign it to one or more batches."}</p></div>
            : viewMode === "table" ? <div className="ve-exam-table-wrap"><StyledExamTable
              key={`${search}|${statusFilter}`}
              keyField="exam_id"
              columns={examColumns}
              data={filtered}
              pagination
              paginationDefaultPage={1}
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 20, 50]}
              paginationComponent={(paginationProps) => <TenantPagination {...paginationProps} portalMenu className="ve-exam-pagination" />}
              responsive
              persistTableHead
              highlightOnHover
              ariaLabel="Exams directory"
            /></div>
            : <div className="ve-exam-grid">{pageItems.map((exam) => <article className="ve-exam-card" key={exam.exam_id}>
              <div className="ve-exam-card__main"><div className="ve-exam-card__title-row"><h2>{exam.title}</h2><span className={`ve-exam-status is-${String(exam.status || "draft").toLowerCase()}`}>{exam.status || "DRAFT"}</span></div>
                <p>{exam.description || "No description provided."}</p>
                <div className="ve-exam-card__meta"><span>{exam.category_name || "Category unavailable"}</span><span><Clock3 size={14} />{exam.duration_minutes} min</span><span>{exam.total_marks ?? "—"} total marks · {exam.passing_marks ?? "—"} to pass</span><span><CalendarDays size={14} />{formatDate(exam.starts_at)}</span></div>
                <div className="ve-exam-card__batches">{(exam.targeted_batches || []).map((batch) => <span key={batch.batch_id}>{batch.batch_name || "Assigned batch"}</span>)}{!exam.targeted_batches?.length && <span>No assigned batches shown</span>}</div>
                {isSuperAdmin && exam.tenant_name && <small className="ve-exam-tenant">{exam.tenant_name}</small>}
              </div>
              <div className="ve-exam-card__actions"><button type="button" className="ve-exam-icon-button" onClick={() => openDetails(exam)} aria-label={`View ${exam.title}`} title="View details"><Eye size={16} /></button><button type="button" className="ve-exam-icon-button" onClick={() => openEdit(exam)} aria-label={`Edit ${exam.title}`} title="Edit exam"><Pencil size={16} /></button>{String(exam.status).toUpperCase() === "DRAFT" && <button type="button" className="ve-exam-icon-button" onClick={() => handlePublish(exam)} aria-label={`Publish ${exam.title}`} title="Publish exam"><Send size={16} /></button>}<button type="button" className="ve-exam-icon-button is-danger" onClick={() => setDeleteTarget(exam)} aria-label={`Delete ${exam.title}`} title="Delete exam"><Trash2 size={16} /></button></div>
            </article>)}</div>}
      {status === "ready" && filtered.length > 0 && viewMode === "grid" && <TenantPagination rowsPerPage={rowsPerPage} rowCount={filtered.length} currentPage={currentPage} onChangePage={setCurrentPage} onChangeRowsPerPage={(size) => setRowsPerPage(size)} paginationRowsPerPageOptions={[5, 10, 20, 50]} portalMenu className="ve-exam-pagination" />}
      <footer className="ve-exam-footer"><span>{filtered.length} matching</span><span>{total} total exams</span></footer>
    </section>
    {formState && <Modal isOpen onClose={() => !submitting && setFormState(null)} title={formState.mode === "edit" ? "Edit exam" : "Create exam"} description={formState.mode === "edit" ? "Update the exam details and status." : "Set exam details, schedule, and target batches."} size="lg" className="ve-exam-modal" closeOnEscape={!submitting} closeOnOverlay={!submitting}>
      {categoriesStatus !== "ready" || batchesStatus !== "ready" ? <div className="ve-exam-modal-loading">{categoriesStatus === "error" || batchesStatus === "error" ? <div className="ve-exam-state is-error"><CircleAlert size={22} /><h2>Exam setup data unavailable</h2><p>{categoriesStatus === "error" ? "Exam categories could not be loaded." : "Target batches could not be loaded."}</p><button type="button" className="ve-exam-button is-secondary" onClick={retry}>Retry</button></div> : <BrandLoader variant="section" message="Loading categories and batches…" />}</div>
        : <ExamForm initial={formState.exam} categories={categories} batches={batches} editing={formState.mode === "edit"} submitting={submitting} onCancel={() => setFormState(null)} onSubmit={submit} />}
    </Modal>}
    {detail && <Modal isOpen onClose={() => setDetail(null)} title={detail.mode === "edit-loading" ? "Loading exam" : detail.exam.title || "Exam details"} description="Review sections, attached questions, and exam structure." size="lg" className="ve-exam-modal">
      <div className="ve-exam-detail">
        {detail.mode === "loading" || detail.mode === "edit-loading" ? <BrandLoader variant="section" message="Loading exam details…" /> : detail.mode === "error" ? <div className="ve-exam-state is-error"><CircleAlert size={22} /><h2>Could not load exam details</h2><p>{detail.error}</p><button type="button" className="ve-exam-button is-secondary" onClick={() => openDetails(detail.exam)}>Try again</button></div> : <>
          <div className="ve-exam-detail-meta"><span className={`ve-exam-status is-${String(detail.data.status || "draft").toLowerCase()}`}>{detail.data.status}</span><span>{detail.data.duration_minutes} minutes</span><span>{detail.data.total_marks} total marks</span><span>{detail.data.passing_marks} passing marks</span></div>
          <p>{detail.data.description || "No description provided."}</p>
          {detail.data.instructions && <div className="ve-exam-instructions"><strong>Instructions</strong><p>{detail.data.instructions}</p></div>}
          <h3>Assigned batches</h3><div className="ve-exam-detail-batches">{(detail.data.targeted_batches || []).map((batch) => <span key={batch.batch_id}>{batch.batch_name}</span>)}{!detail.data.targeted_batches?.length && <p>No targeted batches are available.</p>}</div>
          <div className="ve-exam-section-heading"><h3>Sections</h3></div>
          <div className="ve-exam-section-list">{(detail.data.sections || []).map((section) => <article className="ve-exam-section-card" key={section.section_id}>
            <div className="ve-exam-section-card-heading"><div><strong>{section.section_name}</strong><small>Section {section.section_order ?? "—"}{section.duration_minutes ? ` · ${section.duration_minutes} minutes` : ""}</small></div><button type="button" className="ve-exam-button is-primary" onClick={() => { setDetail(null); setAttachTarget({ ...detail.data, initialSectionId: section.section_id }); }} disabled={!tenantId}><Plus size={14} />Attach questions</button></div>
            <div className="ve-exam-attached-questions">{getSectionQuestions(section, detail.data).map((entry) => {
              const question = entry.question || entry;
              const questionId = asQuestionId(question) || String(entry.question_id || "");
              return <div className="ve-exam-attached-question" key={entry.mapping_id || questionId}><span>{question.question_text || question.text || "Question text unavailable"}</span><small>{entry.marks ?? question.marks ?? "—"} marks{entry.negative_marks != null ? ` · −${entry.negative_marks}` : ""}</small><button type="button" className="ve-exam-remove-question" onClick={() => removeAttachedQuestion(detail.data, questionId)} aria-label="Remove question from exam" disabled={!questionId}><X size={15} /></button></div>;
            })}{getSectionQuestions(section, detail.data).length === 0 && <p>No questions attached to this section yet.</p>}</div>
          </article>)}{!detail.data.sections?.length && <p className="ve-exam-question-empty">This exam has no sections yet.</p>}</div>
        </>}
      </div>
    </Modal>}
    {attachTarget && <Modal isOpen onClose={() => !attachingQuestions && setAttachTarget(null)} title="Attach questions" description="Filter the question bank, select questions, and assign them to an exam section." size="lg" className="ve-exam-modal" closeOnEscape={!attachingQuestions} closeOnOverlay={!attachingQuestions}>
      <AttachQuestionsModal exam={attachTarget} tenantId={tenantId} batches={batches} onCancel={() => setAttachTarget(null)} onAttach={attachSelectedQuestions} attaching={attachingQuestions} />
    </Modal>}
    {deleteTarget && <Modal isOpen onClose={() => !deleting && setDeleteTarget(null)} title="Delete exam?" description="This removes the exam record from the directory." size="sm" className="ve-exam-modal"><div className="ve-exam-delete-copy"><p>Delete this exam?</p><strong>{deleteTarget.title}</strong></div><div className="ve-exam-modal-actions"><button type="button" className="ve-exam-button is-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button><button type="button" className="ve-exam-button is-danger" onClick={confirmDelete} disabled={deleting}>{deleting ? "Deleting…" : "Delete exam"}</button></div></Modal>}
  </main>;
}
