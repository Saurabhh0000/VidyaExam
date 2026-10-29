import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { jsPDF } from "jspdf";
import {
  BookOpen, CalendarDays, ChevronLeft, ChevronRight, ChevronsLeft,
  ChevronsRight, CircleAlert, Download, Eye, FileQuestion, FileSpreadsheet,
  FileText, Pencil, Plus, Search, Trash2, Upload, X, ArrowUpDown,
  Check, ChevronDown,
} from "lucide-react";
import Modal from "../../../shared/components/ui/Modal";
import toast from "../../../shared/components/ui/toast";
import BrandLoader from "../../../shared/components/ui/BrandLoader";
import PageHeader from "../../../shared/components/ui/PageHeader";
import useAuthState from "../../auth/utils/useAuthState";
import useQuestionBankData from "../hooks/useQuestionBankData";
import { getBatches, getBatchErrorMessage } from "../../batches/services/batches.service";
import {
  createQuestion, deleteQuestion, getApiErrorMessage, getQuestionById, updateQuestion,
} from "../services/question.service";
import "../styles/question-bank.css";

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];
const QUESTION_TYPES = [
  { value: "SINGLE_CHOICE", label: "Single choice" },
  { value: "MULTIPLE_CHOICE", label: "Multiple choice" },
  { value: "NUMERICAL", label: "Numerical" },
];
const PAGE_SIZES = [5, 10, 20, 50];
const optionKey = (index) => {
  let value = index + 1;
  let key = "";
  while (value > 0) {
    value -= 1;
    key = String.fromCharCode(65 + (value % 26)) + key;
    value = Math.floor(value / 26);
  }
  return key;
};
const asText = (value) => value == null ? "" : String(value);
const asTopicId = (topic) => String(topic?.topic_id ?? topic?.id ?? "");
const asTopicName = (topic) => topic?.topic_name ?? topic?.name ?? "Unnamed topic";
const asBatchId = (batch) => String(batch?.batch_id ?? batch?.batchId ?? batch?.id ?? "");
const asBatchName = (batch) => batch?.batch_name ?? batch?.name ?? batch?.batch_code ?? "Unnamed batch";
const questionSortValue = (item, key) => key === "category_name"
  ? [item.category_name, item.subject_name].filter(Boolean).join(" ")
  : item?.[key] ?? "";

function DropdownSelect({ value, onChange, options, ariaLabel, className = "", disabled = false, ariaInvalid = false }) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [menuPosition, setMenuPosition] = useState(null);
  const wrapperRef = useRef(null);
  const menuRef = useRef(null);
  const selected = options.find((option) => String(option.value) === String(value)) || options[0];
  const portalMenu = Boolean(open && wrapperRef.current?.closest(".ve-modal"));

  const openMenu = () => {
    if (disabled) return;
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (rect) {
      const estimatedMenuHeight = Math.min(options.length * 48 + 14, 260);
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      setOpenUp(below < estimatedMenuHeight && above > below);
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return undefined;
    const updateMenuPosition = () => {
      if (!portalMenu || !wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const width = Math.min(rect.width, window.innerWidth - 24);
      const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
      const availableHeight = Math.max(0, openUp ? rect.top - 14 : window.innerHeight - rect.bottom - 14);
      const maxHeight = Math.min(260, availableHeight);
      const bottom = window.innerHeight - rect.top + 6;
      setMenuPosition(openUp
        ? { position: "fixed", left, top: "auto", right: "auto", bottom, width, maxHeight, zIndex: 10020 }
        : { position: "fixed", left, top: rect.bottom + 6, right: "auto", bottom: "auto", width, maxHeight, zIndex: 10020 });
    };
    updateMenuPosition();
    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, portalMenu, openUp]);

  return <div className={`qb-select${open ? " is-open" : ""}${openUp ? " opens-up" : ""} ${className}`} ref={wrapperRef}>
    <button type="button" className="qb-select-trigger" aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel} aria-invalid={ariaInvalid || undefined} disabled={disabled} onClick={() => open ? setOpen(false) : openMenu()} onKeyDown={(event) => { if (["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); openMenu(); } }}>
      <span>{selected?.label ?? "Select an option"}</span><ChevronDown size={17} aria-hidden="true" />
    </button>
    {open && (() => {
      const menu = <div className="qb-select-menu" role="listbox" aria-label={ariaLabel} ref={menuRef} style={portalMenu ? menuPosition || undefined : undefined}>
        {options.map((option) => <button type="button" role="option" aria-selected={String(option.value) === String(value)} className="qb-select-option" key={option.value} onClick={() => { onChange(option.value); setOpen(false); }}>
          <span>{option.label}</span>{String(option.value) === String(value) && <Check size={16} aria-hidden="true" />}
        </button>)}
      </div>;
      return portalMenu ? createPortal(menu, document.body) : menu;
    })()}
  </div>;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") { row.push(field); field = ""; }
    else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field); field = "";
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
    } else field += character;
  }
  row.push(field);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

function csvCell(value) {
  const text = asText(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadFile(contents, type, filename) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

let reportLogoPromise;
function loadQuestionBankLogo() {
  if (!reportLogoPromise) reportLogoPromise = fetch(`${import.meta.env.BASE_URL}logo.png`)
    .then((response) => {
      if (!response.ok) throw new Error("The VidyaExam logo could not be loaded.");
      return response.blob();
    })
    .then((blob) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("The VidyaExam logo could not be prepared."));
      reader.readAsDataURL(blob);
    }));
  return reportLogoPromise;
}

function pdfText(value) {
  return asText(value).replace(/[\u2010-\u2015]/g, "-").replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/\u2026/g, "...").replace(/[^\x20-\xFF]/g, " ");
}

function optionRows(options) {
  return (Array.isArray(options) ? options : []).map((option, index) => ({
    option_key: optionKey(index),
    option_text: asText(option.option_text),
    is_correct: Boolean(option.is_correct),
  }));
}

function QuestionForm({ initial, topics, topicsStatus, topicsError, onRetryTopics, batches, batchesStatus, batchesError, onRetryBatches, isSuperAdmin, submitting, canCreate, onCancel, onSubmit }) {
  const editing = Boolean(initial?.question_id);
  const correctOptionGroup = useId();
  const [topicId, setTopicId] = useState(asText(initial?.topic_id));
  const [batchId, setBatchId] = useState(asText(initial?.batch_id));
  const [questionType, setQuestionType] = useState(initial?.question_type || "SINGLE_CHOICE");
  const [difficulty, setDifficulty] = useState(initial?.difficulty_level || "MEDIUM");
  const [questionText, setQuestionText] = useState(asText(initial?.question_text));
  const [explanation, setExplanation] = useState(asText(initial?.explanation));
  const [numericalAnswer, setNumericalAnswer] = useState(asText(initial?.numerical_answer ?? initial?.correct_answer));
  const [marks, setMarks] = useState(asText(initial?.default_marks ?? "1"));
  const [negativeMarks, setNegativeMarks] = useState(asText(initial?.default_negative_marks ?? "0"));
  const [options, setOptions] = useState(() => optionRows(initial?.options).length
    ? optionRows(initial.options)
    : [{ option_key: "A", option_text: "", is_correct: true }, { option_key: "B", option_text: "", is_correct: false }]);
  const [errors, setErrors] = useState({});
  const topicOptions = [
    { value: "", label: topicsStatus === "loading" ? "Loading topics…" : "Select a topic" },
    ...topics.map((topic) => ({
      value: asTopicId(topic),
      label: [asTopicName(topic), topic.subject_name].filter(Boolean).join(" · "),
    })),
  ];
  const batchOptions = [
    { value: "", label: batchesStatus === "loading" ? "Loading batches…" : "Select a batch" },
    ...batches.map((batch) => ({ value: asBatchId(batch), label: [asBatchName(batch), batch.batch_code].filter(Boolean).join(" · ") })),
  ];
  if (editing && batchId && !batches.some((batch) => asBatchId(batch) === batchId)) {
    batchOptions.push({ value: batchId, label: initial?.batch_name || `Batch ${batchId}` });
  }
  const changeOption = (index, key, value) => {
    setOptions((current) => current.map((option, position) => position === index ? { ...option, [key]: value } : option));
  };
  const validate = () => {
    const next = {};
    if (!topicId || (!editing && !topics.some((topic) => asTopicId(topic) === topicId))) next.topicId = "Choose a valid topic.";
    if (!isSuperAdmin && (!batchId || !batchOptions.some((batch) => batch.value === batchId))) next.batchId = "Choose a valid batch.";
    if (!questionText.trim()) next.questionText = "Enter the question.";
    else if (questionText.trim().length > 5000) next.questionText = "Question cannot exceed 5,000 characters.";
    if (explanation.length > 5000) next.explanation = "Explanation cannot exceed 5,000 characters.";
    if (!DIFFICULTIES.includes(difficulty)) next.difficulty = "Choose a valid difficulty.";
    if (!QUESTION_TYPES.some((type) => type.value === questionType)) next.questionType = "Choose a valid question type.";
    if (marks === "" || !Number.isFinite(Number(marks)) || Number(marks) <= 0) next.marks = "Marks must be a number greater than 0.";
    if (negativeMarks === "" || !Number.isFinite(Number(negativeMarks)) || Number(negativeMarks) < 0) next.negativeMarks = "Negative marks must be a non-negative number.";
    else if (Number.isFinite(Number(marks)) && Number(marks) > 0 && Number(negativeMarks) > Number(marks)) next.negativeMarks = "Negative marks cannot exceed marks.";
    if (questionType === "NUMERICAL") {
      if (!numericalAnswer.trim()) next.numericalAnswer = "Enter the correct numerical answer.";
      else if (!Number.isFinite(Number(numericalAnswer))) next.numericalAnswer = "Enter a valid number.";
    } else {
      if (options.length < 2) next.options = "Add at least two answer options.";
      else if (options.some((option) => !option.option_text.trim())) next.options = "Every answer option needs text.";
      const correctCount = options.filter((option) => option.is_correct).length;
      if (questionType === "SINGLE_CHOICE" && correctCount !== 1) next.correct = "Select exactly one correct answer.";
      if (questionType === "MULTIPLE_CHOICE" && correctCount < 1) next.correct = "Select at least one correct answer.";
    }
    setErrors(next);
    return next;
  };
  const submit = (event) => {
    event.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      const messages = Object.values(validationErrors);
      const visibleMessages = messages.slice(0, 3).join(" ");
      const remainingCount = messages.length - 3;
      toast.warning("Please review the question form", {
        description: `${visibleMessages}${remainingCount > 0 ? ` And ${remainingCount} more issue${remainingCount === 1 ? "" : "s"}.` : ""}`,
      });
      return;
    }
    const optionPayload = questionType === "NUMERICAL" ? [] : options.map((option, index) => ({
      option_key: optionKey(index),
      option_text: option.option_text.trim(),
      is_correct: Boolean(option.is_correct),
    }));
    const payload = {
      question_text: questionText.trim(),
      explanation: explanation.trim(),
      difficulty_level: difficulty,
      default_marks: Number(marks),
      default_negative_marks: Number(negativeMarks),
      options: optionPayload,
      ...(isSuperAdmin
        ? (editing && initial?.batch_id ? { batch_id: initial.batch_id } : {})
        : { batch_id: batchId }),
      ...(questionType === "NUMERICAL" ? { numerical_answer: Number(numericalAnswer), correct_answer: Number(numericalAnswer) } : {}),
    };
    if (!editing) {
      payload.topic_id = topicId;
      payload.question_type = questionType;
    }
    onSubmit(payload);
  };

  return (
    <form className="qb-form" onSubmit={submit} noValidate>
      <div className="qb-form-grid">
        <label className="qb-field qb-field--wide qb-field--topic">
          <span>Topic <b>*</b></span>
          {editing ? (
            <input value={initial?.topic_name || asTopicName(topics.find((topic) => asTopicId(topic) === topicId))} readOnly aria-readonly="true" />
          ) : (
            <DropdownSelect
              className="qb-form-select"
              value={topicId}
              onChange={setTopicId}
              options={topicOptions}
              ariaLabel="Topic"
              ariaInvalid={Boolean(errors.topicId)}
              disabled={topicsStatus !== "ready" || !topics.length}
            />
          )}
          {errors.topicId && <small className="qb-field-error">{errors.topicId}</small>}
          {topicsStatus === "loading" && <BrandLoader variant="section" className="ve-brand-loader--compact qb-topic-loader" message="Loading available topics…" />}
          {topicsStatus === "error" && <small className="qb-field-error">{topicsError} <button type="button" className="qb-inline-action" onClick={onRetryTopics}>Retry</button></small>}
          {topicsStatus === "ready" && !topics.length && !editing && <small className="qb-field-hint">No topics are available yet. Add a topic in Taxonomy first.</small>}
        </label>
        {!isSuperAdmin && <label className="qb-field qb-field--batch">
          <span>Batch / class <b>*</b></span>
          <DropdownSelect
            className="qb-form-select"
            value={batchId}
            onChange={(value) => { setBatchId(value); setErrors((current) => ({ ...current, batchId: "" })); }}
            options={batchOptions}
            ariaLabel="Batch or class"
            ariaInvalid={Boolean(errors.batchId)}
            disabled={batchesStatus !== "ready" || (!batches.length && !editing)}
          />
          {errors.batchId && <small className="qb-field-error">{errors.batchId}</small>}
          {batchesStatus === "loading" && <BrandLoader variant="section" className="ve-brand-loader--compact qb-topic-loader" message="Loading available batches…" />}
          {batchesStatus === "error" && <small className="qb-field-error">{batchesError} <button type="button" className="qb-inline-action" onClick={onRetryBatches}>Retry</button></small>}
          {batchesStatus === "ready" && !batches.length && <small className="qb-field-hint">Create a batch in Master before adding questions.</small>}
        </label>}
        <label className="qb-field qb-field--question-type">
          <span>Question type <b>*</b></span>
          <DropdownSelect
            className="qb-form-select"
            value={questionType}
            onChange={setQuestionType}
            options={QUESTION_TYPES}
            ariaLabel="Question type"
            ariaInvalid={Boolean(errors.questionType)}
            disabled={editing}
          />
          {errors.questionType && <small className="qb-field-error">{errors.questionType}</small>}
          {editing && <small className="qb-field-hint">Question type cannot be changed by the documented update API.</small>}
        </label>
        <label className="qb-field qb-field--difficulty">
          <span>Difficulty <b>*</b></span>
          <DropdownSelect
            className="qb-form-select"
            value={difficulty}
            onChange={setDifficulty}
            options={DIFFICULTIES.map((value) => ({ value, label: value.charAt(0) + value.slice(1).toLowerCase() }))}
            ariaLabel="Difficulty"
            ariaInvalid={Boolean(errors.difficulty)}
          />
          {errors.difficulty && <small className="qb-field-error">{errors.difficulty}</small>}
        </label>
        <label className="qb-field qb-field--marks">
          <span>Default marks <b>*</b></span>
          <input type="number" min="0.01" step="any" required value={marks} onChange={(event) => setMarks(event.target.value)} aria-invalid={Boolean(errors.marks)} />
          {errors.marks && <small className="qb-field-error">{errors.marks}</small>}
        </label>
        <label className="qb-field qb-field--negative-marks">
          <span>Negative marks <b>*</b></span>
          <input type="number" min="0" max={marks || undefined} step="any" required value={negativeMarks} onChange={(event) => setNegativeMarks(event.target.value)} aria-invalid={Boolean(errors.negativeMarks)} />
          {errors.negativeMarks && <small className="qb-field-error">{errors.negativeMarks}</small>}
        </label>
        <label className="qb-field qb-field--wide">
          <span>Question <b>*</b></span>
          <textarea rows="3" maxLength={5000} value={questionText} onChange={(event) => setQuestionText(event.target.value)} placeholder="Write your question" aria-invalid={Boolean(errors.questionText)} />
          {errors.questionText && <small className="qb-field-error">{errors.questionText}</small>}
        </label>
        <label className="qb-field qb-field--wide">
          <span>Explanation <small>(optional)</small></span>
          <textarea rows="2" maxLength={5000} value={explanation} onChange={(event) => setExplanation(event.target.value)} placeholder="Explain the answer" aria-invalid={Boolean(errors.explanation)} />
          {errors.explanation && <small className="qb-field-error">{errors.explanation}</small>}
        </label>
      </div>

      {questionType === "NUMERICAL" ? (
        <label className="qb-field qb-field--wide">
          <span>Correct numerical answer <b>*</b></span>
          <input type="number" step="any" value={numericalAnswer} onChange={(event) => setNumericalAnswer(event.target.value)} placeholder="Enter the correct number" aria-invalid={Boolean(errors.numericalAnswer)} />
          {errors.numericalAnswer && <small className="qb-field-error">{errors.numericalAnswer}</small>}
        </label>
      ) : (
      <fieldset className="qb-options-editor">
        <legend>Answer options <b>*</b></legend>
        <p>{questionType === "MULTIPLE_CHOICE" ? "Select every correct answer." : "Select the radio button beside the correct answer."}</p>
        {options.map((option, index) => (
          <div className="qb-option-editor-row" key={`${index}-${option.option_key}`}>
            <label className="qb-correct-choice" aria-label={`Mark option ${optionKey(index)} correct`}>
              <input type={questionType === "MULTIPLE_CHOICE" ? "checkbox" : "radio"} name={`qb-correct-option-${correctOptionGroup}`} checked={option.is_correct} onChange={(event) => { const checked = event.currentTarget.checked; setOptions((current) => current.map((item, i) => questionType === "MULTIPLE_CHOICE" ? (i === index ? { ...item, is_correct: checked } : item) : { ...item, is_correct: i === index && checked })); }} />
              <span>{optionKey(index)}</span>
            </label>
            <input aria-label={`Option ${optionKey(index)} text`} maxLength={1000} value={option.option_text} onChange={(event) => changeOption(index, "option_text", event.target.value)} placeholder={`Option ${optionKey(index)}`} />
            <button type="button" className="qb-icon-button" onClick={() => setOptions((current) => current.filter((_, i) => i !== index).map((item, i) => ({ ...item, option_key: optionKey(i) })))} disabled={options.length <= 2} aria-label={`Remove option ${optionKey(index)}`}><X size={16} /></button>
          </div>
        ))}
        {errors.options && <small className="qb-field-error">{errors.options}</small>}
        {errors.correct && <small className="qb-field-error">{errors.correct}</small>}
        <button type="button" className="qb-text-button" onClick={() => setOptions((current) => [...current, { option_key: optionKey(current.length), option_text: "", is_correct: false }])}><Plus size={16} /> Add option</button>
      </fieldset>
      )}

      <div className="qb-modal-actions">
        <button type="button" className="qb-button qb-button--secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
        <button type="submit" className="qb-button qb-button--primary" disabled={submitting || (!editing && (!canCreate || !topics.length || topicsStatus !== "ready"))} aria-busy={submitting}>{submitting ? (editing ? "Saving…" : "Creating…") : editing ? "Save changes" : "Create question"}</button>
      </div>
    </form>
  );
}

function DetailContent({ question }) {
  if (!question) return null;
  const options = Array.isArray(question.options) ? question.options : [];
  return <div className="qb-detail-content">
    <div className="qb-detail-tags"><span>{question.question_type?.replaceAll("_", " ") || "Question"}</span><span className={`qb-difficulty is-${String(question.difficulty_level || "").toLowerCase()}`}>{question.difficulty_level || "—"}</span><span>{question.default_marks ?? "—"} marks</span><span>{question.default_negative_marks ?? "—"} negative</span></div>
    <h3>{question.question_text || "Question text unavailable"}</h3>
    {question.question_text_hi && <p className="qb-hindi">{question.question_text_hi}</p>}
    {(question.batch_name || question.batch_code) && <p className="qb-hierarchy">Batch / class: {[question.batch_name, question.batch_code].filter(Boolean).join(" · ")}</p>}
    <p className="qb-hierarchy">{[question.category_name, question.subject_name, question.topic_name].filter(Boolean).join(" · ") || "Topic details unavailable"}</p>
    <div className="qb-detail-options">{options.map((option, index) => <div className={`qb-detail-option${option.is_correct ? " is-correct" : ""}`} key={option.option_id || option.option_key || index}><b>{option.option_key || optionKey(index)}</b><span>{option.option_text || "—"}</span>{option.is_correct && <em>Correct answer</em>}</div>)}</div>
    {question.explanation && <div className="qb-explanation"><strong>Explanation</strong><p>{question.explanation}</p></div>}
    <dl className="qb-dates">{question.created_at && <div><dt>Created</dt><dd>{new Date(question.created_at).toLocaleString()}</dd></div>}{question.updated_at && <div><dt>Updated</dt><dd>{new Date(question.updated_at).toLocaleString()}</dd></div>}</dl>
  </div>;
}

function getCreatorId(question) {
  return question?.created_by ?? question?.created_by_user_id ?? question?.creator_id ?? null;
}

export default function QuestionBankPage({ initialCreate = false, compact = false }) {
  const { user } = useAuthState();
  const role = String(user?.role || "").toUpperCase();
  const tenantId = role === "SUPER_ADMIN" ? null : user?.activeTenantId;
  const { questions, count, topics, status, topicsStatus, error, topicsError, refresh, refreshTopics } = useQuestionBankData(role, tenantId);
  const [batches, setBatches] = useState([]);
  const [batchesStatus, setBatchesStatus] = useState("loading");
  const [batchesError, setBatchesError] = useState("");
  const [batchesRefresh, setBatchesRefresh] = useState(0);
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [subject, setSubject] = useState("ALL");
  const [topic, setTopic] = useState("ALL");
  const [type, setType] = useState("ALL");
  const [difficulty, setDifficulty] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(initialCreate);
  const [formInitial, setFormInitial] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [detailState, setDetailState] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkFileName, setBulkFileName] = useState("");
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkTopicId, setBulkTopicId] = useState("");
  const [bulkBatchId, setBulkBatchId] = useState("");
  const [bulkQuestionType, setBulkQuestionType] = useState("SINGLE_CHOICE");
  const [bulkDifficulty, setBulkDifficulty] = useState("MEDIUM");
  const [bulkMarks, setBulkMarks] = useState("1");
  const [bulkNegativeMarks, setBulkNegativeMarks] = useState("1");
  const [bulkSettingsErrors, setBulkSettingsErrors] = useState({});
  const [sort, setSort] = useState({ key: "created_at", direction: "desc" });
  const handledQueryAction = useRef("");
  const bulkFileRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    if (role !== "SUPER_ADMIN" && !tenantId) {
      setBatches([]);
      setBatchesStatus("error");
      setBatchesError("Select an active organization to load its batches.");
      return () => controller.abort();
    }
    setBatchesStatus("loading");
    setBatchesError("");
    getBatches({ signal: controller.signal })
      .then((result) => {
        setBatches(Array.isArray(result?.data) ? result.data : []);
        setBatchesStatus("ready");
      })
      .catch((requestError) => {
        if (requestError?.name === "CanceledError") return;
        setBatchesError(getBatchErrorMessage(requestError, requestError.message || "Batches could not be loaded."));
        setBatchesStatus("error");
      });
    return () => controller.abort();
  }, [role, tenantId, batchesRefresh]);

  useEffect(() => {
    if (initialCreate || /\/questions\/create\/?$/.test(location.pathname)) setFormOpen(true);
  }, [initialCreate, location.pathname]);

  const categories = useMemo(() => [...new Set(questions.map((item) => item.category_name).filter(Boolean))], [questions]);
  const subjects = useMemo(() => [...new Set(questions.filter((item) => category === "ALL" || item.category_name === category).map((item) => item.subject_name).filter(Boolean))], [questions, category]);
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return questions.filter((item) => {
      const searchMatch = !query || [item.question_text, item.topic_name, item.subject_name, item.category_name, item.batch_name, item.batch_code].some((value) => String(value || "").toLocaleLowerCase().includes(query));
      return searchMatch && (category === "ALL" || item.category_name === category) && (subject === "ALL" || item.subject_name === subject) && (topic === "ALL" || String(item.topic_id) === topic) && (type === "ALL" || item.question_type === type) && (difficulty === "ALL" || item.difficulty_level === difficulty);
    });
  }, [questions, search, category, subject, topic, type, difficulty]);
  const sortedQuestions = useMemo(() => [...filtered].sort((left, right) => {
    const a = questionSortValue(left, sort.key);
    const b = questionSortValue(right, sort.key);
    const compared = sort.key === "created_at"
      ? (Date.parse(a) || 0) - (Date.parse(b) || 0)
      : sort.key === "default_marks"
        ? (Number(a) || 0) - (Number(b) || 0)
        : String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
    return sort.direction === "asc" ? compared : -compared;
  }), [filtered, sort]);
  const pageCount = Math.max(1, Math.ceil(sortedQuestions.length / pageSize));
  const visibleQuestions = sortedQuestions.slice((page - 1) * pageSize, page * pageSize);
  const difficultyCounts = useMemo(() => questions.reduce((counts, item) => {
    const value = String(item.difficulty_level || "").toUpperCase();
    if (Object.hasOwn(counts, value)) counts[value] += 1;
    return counts;
  }, { EASY: 0, MEDIUM: 0, HARD: 0 }), [questions]);
  useEffect(() => setPage(1), [search, category, subject, topic, type, difficulty, pageSize]);

  const clearFilters = () => { setSearch(""); setCategory("ALL"); setSubject("ALL"); setTopic("ALL"); setType("ALL"); setDifficulty("ALL"); };
  const openEdit = useCallback(async (item) => {
    setDetailState({ status: "loading", mode: "edit" });
    try {
      const latest = await getQuestionById(item.question_id);
      setDetailState(null);
      setFormInitial(latest);
      setFormOpen(true);
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, requestError.message || "Question details could not be loaded.");
      toast.error("Unable to edit question", { description: message });
      setDetailState(null);
    }
  }, []);
  const openDetails = useCallback(async (item) => {
    setDetailState({ status: "loading", mode: "view", question: null, item });
    try {
      const detail = await getQuestionById(item.question_id);
      setDetailState({ status: "ready", mode: "view", question: detail, item });
    } catch (requestError) {
      setDetailState({ status: "error", mode: "view", error: getApiErrorMessage(requestError, requestError.message || "Question details could not be loaded."), item });
    }
  }, []);
  const manageQuestion = useCallback((item) => role === "SUPER_ADMIN" || role === "ADMIN" || (getCreatorId(item) != null && String(getCreatorId(item)) === String(user?.userId)), [role, user?.userId]);
  useEffect(() => {
    if (status !== "ready") return;
    const params = new URLSearchParams(location.search);
    const viewId = params.get("viewId");
    const editId = params.get("editId");
    const actionId = viewId ? `view:${viewId}` : editId ? `edit:${editId}` : "";
    if (!actionId || handledQueryAction.current === actionId) return;
    handledQueryAction.current = actionId;
    const item = questions.find((question) => String(question.question_id) === String(viewId || editId));
    if (!item) {
      toast.error("Question unavailable", { description: "This question is not present in the current question list." });
    } else if (viewId) {
      openDetails(item);
    } else if (manageQuestion(item)) {
      openEdit(item);
    } else {
      toast.error("Edit unavailable", { description: "You can edit only questions that the backend identifies as yours." });
    }
  }, [status, location.search, questions, openDetails, openEdit, manageQuestion]);
  const submitQuestion = async (payload) => {
    if (role !== "SUPER_ADMIN" && !tenantId) {
      toast.error("Organization required", { description: "Select an active organization before creating a question." });
      return;
    }
    setSubmitting(true);
    try {
      if (formInitial?.question_id) {
        await updateQuestion(formInitial.question_id, payload);
        toast.success("Question updated successfully.");
      } else {
        await createQuestion({ tenant_id: role === "SUPER_ADMIN" ? null : tenantId, ...payload });
        toast.success("Question created successfully.");
      }
      setFormOpen(false);
      setFormInitial(null);
      refresh();
    } catch (requestError) {
      toast.error(formInitial ? "Unable to update question" : "Unable to create question", { description: getApiErrorMessage(requestError, requestError.message) });
    } finally {
      setSubmitting(false);
    }
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteQuestion(deleteTarget.question_id);
      toast.success("Question deleted successfully.");
      setDeleteTarget(null);
      if (visibleQuestions.length === 1 && page > 1) setPage((current) => current - 1);
      refresh();
    } catch (requestError) {
      toast.error("Unable to delete question", { description: getApiErrorMessage(requestError, requestError.message) });
    } finally {
      setDeleting(false);
    }
  };

  const toggleSort = (key) => setSort((current) => ({
    key,
    direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
  }));
  const exportCsv = () => {
    if (status !== "ready" || !sortedQuestions.length) {
      toast.warning("Nothing to export", { description: "There are no questions in the current results." });
      return;
    }
    const headers = ["Question", "Category", "Subject", "Topic", "Type", "Difficulty", "Marks", "Negative marks", "Correct answer", "Options", "Explanation", "Created"];
    const lines = sortedQuestions.map((item) => {
      const options = Array.isArray(item.options) ? item.options : [];
      const correct = options.find((option) => option.is_correct);
      return [item.question_text, item.category_name, item.subject_name, item.topic_name, item.question_type, item.difficulty_level, item.default_marks, item.default_negative_marks, correct?.option_key, options.map((option) => `${option.option_key || ""}: ${option.option_text || ""}`).join(" | "), item.explanation, item.created_at].map(csvCell).join(",");
    });
    downloadFile(`\uFEFF${[headers.map(csvCell).join(","), ...lines].join("\r\n")}`, "text/csv;charset=utf-8", "vidyaexam-question-bank.csv");
    toast.success("CSV export ready", { description: `${sortedQuestions.length} question${sortedQuestions.length === 1 ? "" : "s"} exported from the current results.` });
  };
  const exportPdf = async () => {
    if (status !== "ready" || !sortedQuestions.length) {
      toast.warning("Nothing to export", { description: "There are no questions in the current results." });
      return;
    }
    try {
      const logo = await loadQuestionBankLogo();
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4", compress: true });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 42;
      const contentWidth = pageWidth - margin * 2;
      const navy = [23, 43, 77];
      const teal = [15, 118, 110];
      const muted = [101, 119, 145];
      const pale = [239, 248, 247];
      const border = [222, 233, 235];
      const exportedAt = new Date().toLocaleString();
      const organization = user?.activeTenantName ? ` · ${pdfText(user.activeTenantName)}` : "";
      const addHeader = (continuation = false) => {
        pdf.setFillColor(...navy);
        pdf.rect(0, 0, pageWidth, 120, "F");
        pdf.setFillColor(...teal);
        pdf.rect(0, 116, pageWidth, 4, "F");
        pdf.addImage(logo, "PNG", margin, 35, 158, 52.5, undefined, "FAST");
        pdf.setDrawColor(64, 95, 128);
        pdf.line(margin + 178, 28, margin + 178, 92);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        pdf.setTextColor(111, 224, 207);
        pdf.text("VIDYAEXAM  /  QUESTION LIBRARY", margin + 198, 42);
        pdf.setFontSize(18);
        pdf.setTextColor(255, 255, 255);
        pdf.text(continuation ? "Question Bank (continued)" : "Question Bank Export", margin + 198, 63);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(222, 233, 243);
        pdf.text(`${sortedQuestions.length} questions${organization}`, margin + 198, 80);
        pdf.text(`Generated ${exportedAt}`, margin + 198, 96);
        return 145;
      };
      const addFooter = (pageNumber) => {
        pdf.setDrawColor(...border);
        pdf.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(...muted);
        pdf.text("VidyaExam  |  Question Bank", margin, pageHeight - 16);
        pdf.text(`Page ${pageNumber}`, pageWidth - margin, pageHeight - 16, { align: "right" });
      };

      let y = addHeader();
      let pageNumber = 1;
      sortedQuestions.forEach((item, index) => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        const question = pdf.splitTextToSize(pdfText(item.question_text || "Question text unavailable"), contentWidth - 76);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        const trail = pdf.splitTextToSize(pdfText([item.category_name, item.subject_name, item.topic_name].filter(Boolean).join(" / ") || "Uncategorized"), contentWidth - 72);
        pdf.setFontSize(9);
        const options = (Array.isArray(item.options) ? item.options : []).map((option, optionIndex) => ({
          rawText: `${pdfText(option.option_key || optionKey(optionIndex))}. ${pdfText(option.option_text)}`,
          correct: Boolean(option.is_correct),
        })).map((option) => {
          const correctLabelWidth = option.correct ? 61 : 0;
          return {
            ...option,
            text: pdf.splitTextToSize(option.rawText, contentWidth - 88 - correctLabelWidth),
          };
        });
        const questionHeight = Math.max(28, question.length * 15);
        const trailHeight = trail.length * 11;
        const optionsHeight = options.reduce((height, option) => height + Math.max(20, option.text.length * 12) + 5, 0);
        const explanationLines = item.explanation ? pdf.splitTextToSize(pdfText(item.explanation), contentWidth - 72).length : 0;
        const cardHeight = 70 + questionHeight + trailHeight + optionsHeight + (item.explanation ? 27 + explanationLines * 11 : 0);
        if (y + cardHeight > pageHeight - 48) {
          addFooter(pageNumber);
          pdf.addPage();
          pageNumber += 1;
          y = addHeader(true);
        }

        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(...border);
        pdf.setLineWidth(0.8);
        pdf.roundedRect(margin, y, contentWidth, cardHeight, 9, 9, "FD");
        pdf.setFillColor(...pale);
        pdf.roundedRect(margin + 14, y + 14, 31, 27, 7, 7, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(...teal);
        pdf.text(String(index + 1).padStart(2, "0"), margin + 29.5, y + 32, { align: "center" });

        const difficultyLabel = pdfText(item.difficulty_level || "UNRATED").toUpperCase();
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        pdf.setTextColor(...teal);
        pdf.text(`${difficultyLabel}   |   ${item.default_marks ?? 0} MARKS   |   -${item.default_negative_marks ?? 0} NEGATIVE`, margin + 56, y + 19);

        let textY = y + 42;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(...navy);
        pdf.text(question, margin + 56, textY);
        textY += questionHeight + 2;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(...muted);
        pdf.text(trail, margin + 56, textY);
        textY += trailHeight + 11;

        options.forEach((option) => {
          pdf.setFont("helvetica", option.correct ? "bold" : "normal");
          pdf.setFontSize(9);
          const textWidth = Math.max(...option.text.map((line) => pdf.getTextWidth(line)));
          const labelWidth = option.correct ? pdf.getTextWidth("Correct answer") : 0;
          if (option.correct) {
            pdf.setFillColor(232, 247, 242);
            const optionHeight = Math.max(19, option.text.length * 12 + 7);
            const optionWidth = Math.min(contentWidth - 72, textWidth + labelWidth + 32);
            pdf.roundedRect(margin + 56, textY - 12, optionWidth, optionHeight, 4, 4, "F");
          }
          pdf.setTextColor(...(option.correct ? teal : navy));
          pdf.text(option.text, margin + 65, textY);
          if (option.correct) {
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(7);
            pdf.setTextColor(...teal);
            const labelX = Math.min(margin + 65 + textWidth + 8, margin + 56 + contentWidth - 72 - labelWidth - 8);
            pdf.text("Correct answer", labelX, textY + (option.text.length - 1) * 12);
          }
          textY += Math.max(20, option.text.length * 12) + 5;
        });
        if (item.explanation) {
          const explanation = pdf.splitTextToSize(pdfText(item.explanation), contentWidth - 72);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(8);
          pdf.setTextColor(...teal);
          pdf.text("EXPLANATION", margin + 56, textY + 3);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(...muted);
          pdf.text(explanation, margin + 56, textY + 15);
        }
        y += cardHeight + 12;
      });
      addFooter(pageNumber);
      pdf.save(`vidyaexam-question-bank-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF downloaded", { description: `${sortedQuestions.length} question${sortedQuestions.length === 1 ? "" : "s"} exported with VidyaExam branding.` });
    } catch (exportError) {
      toast.error("Unable to export PDF", { description: exportError.message || "Please try again." });
    }
  };
  const handleBulkFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (topicsStatus !== "ready") {
      toast.error("Topics are not ready", { description: topicsError || "Wait for the topic list to finish loading, then upload the CSV." });
      return;
    }
    setBulkFileName(file.name);
    setBulkRows([]);
    setBulkResult(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Choose a CSV file", { description: "Bulk question upload currently supports .csv files." });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("CSV file is too large", { description: "Choose a CSV file smaller than 2 MB." });
      return;
    }
    const settingsErrors = validateBulkSettings();
    if (Object.keys(settingsErrors).length > 0) {
      toast.warning("Please review the upload settings", {
        description: Object.values(settingsErrors).slice(0, 3).join(" "),
      });
      return;
    }
    try {
      const table = parseCsv((await file.text()).replace(/^\uFEFF/, ""));
      if (table.length < 2) throw new Error("The CSV needs a header row and at least one question row.");
      const headers = table[0].map((value) => value.trim().toLowerCase().replaceAll(" ", "_"));
      const required = ["question_text"];
      const missing = required.filter((name) => !headers.includes(name));
      if (missing.length) throw new Error(`Missing required columns: ${missing.join(", ")}. Download the sample CSV for the expected format.`);
      const parsed = table.slice(1).map((cells, index) => {
        const row = Object.fromEntries(headers.map((header, column) => [header, (cells[column] || "").trim()]));
        const issues = [];
        const topicIdValue = bulkTopicId;
        if (!topicIdValue || !topics.some((item) => asTopicId(item) === String(topicIdValue))) issues.push("Unknown or missing topic");
        if (role !== "SUPER_ADMIN" && (!bulkBatchId || !batches.some((item) => asBatchId(item) === String(bulkBatchId)))) issues.push("Choose a valid batch");
        if (!row.question_text) issues.push("Question text is required");
        const questionType = bulkQuestionType;
        if (!QUESTION_TYPES.some((item) => item.value === questionType)) issues.push("Question type must be SINGLE_CHOICE, MULTIPLE_CHOICE, or NUMERICAL");
        const level = bulkDifficulty;
        if (!DIFFICULTIES.includes(level)) issues.push("Difficulty must be Easy, Medium, or Hard");
        const optionKeys = headers.filter((header) => /^option_[a-z]$/.test(header)).sort();
        const options = optionKeys.map((key) => ({ option_key: key.slice(-1).toUpperCase(), option_text: row[key] || "" })).filter((option) => option.option_text);
        const correctKeys = (row.correct_option || "").toUpperCase().split(/[|;,\s]+/).filter(Boolean);
        if (questionType === "SINGLE_CHOICE" || questionType === "MULTIPLE_CHOICE") {
          if (options.length < 2) issues.push("At least two non-empty option columns are required");
          if (questionType === "SINGLE_CHOICE" && correctKeys.length !== 1) issues.push("Single choice questions need exactly one correct_option (for example, A)");
          if (questionType === "MULTIPLE_CHOICE" && correctKeys.length < 1) issues.push("Multiple choice questions need one or more correct_option values separated by | (for example, A|C)");
          if (new Set(correctKeys).size !== correctKeys.length) issues.push("correct_option contains duplicate answer keys");
          if (correctKeys.some((key) => !options.some((option) => option.option_key === key))) issues.push("Every correct option must match a non-empty option column");
        }
        const numericalAnswer = row.numerical_answer || row.correct_answer || "";
        if (questionType === "NUMERICAL" && !numericalAnswer) issues.push("Numerical questions need a numerical_answer value");
        else if (questionType === "NUMERICAL" && !Number.isFinite(Number(numericalAnswer))) issues.push("numerical_answer must be a valid number");
        const marks = Number(bulkMarks);
        const negativeMarks = Number(bulkNegativeMarks);
        if (!Number.isFinite(marks) || marks <= 0) issues.push("default_marks must be a number greater than 0");
        if (!Number.isFinite(negativeMarks) || negativeMarks < 0) issues.push("default_negative_marks must be a non-negative number");
        else if (Number.isFinite(marks) && marks > 0 && negativeMarks > marks) issues.push("default_negative_marks cannot exceed default_marks");
        if (index >= 100) issues.push("Maximum upload is 100 questions at a time");
        return {
          rowNumber: index + 2,
          error: issues.join("; "),
          payload: {
            tenant_id: role === "SUPER_ADMIN" ? null : tenantId,
            ...(role !== "SUPER_ADMIN" ? { batch_id: bulkBatchId } : {}),
            topic_id: topicIdValue,
            question_type: questionType,
            difficulty_level: level,
            question_text: row.question_text,
            explanation: row.explanation || "",
            default_marks: marks,
            default_negative_marks: negativeMarks,
            options: questionType === "NUMERICAL" ? [] : options.map((option) => ({ ...option, is_correct: correctKeys.includes(option.option_key) })),
            ...(questionType === "NUMERICAL" ? { numerical_answer: numericalAnswer, correct_answer: numericalAnswer } : {}),
          },
        };
      });
      setBulkRows(parsed);
      setBulkResult(null);
      setBulkOpen(true);
      const invalidCount = parsed.filter((item) => item.error).length;
      if (invalidCount) toast.warning("CSV loaded with validation issues", { description: `${parsed.length - invalidCount} valid and ${invalidCount} invalid rows. Review them before importing.` });
      else toast.success("CSV validated", { description: `${parsed.length} question${parsed.length === 1 ? "" : "s"} are ready to import.` });
    } catch (fileError) {
      toast.error("Could not read this CSV", { description: fileError.message || "Check the CSV format and try again." });
    }
  };
  const downloadBulkTemplate = () => {
    const isNumerical = bulkQuestionType === "NUMERICAL";
    const header = isNumerical
      ? ["question_text", "numerical_answer", "explanation"]
      : ["question_text", "option_a", "option_b", "option_c", "option_d", "correct_option", "explanation"];
    const sample = isNumerical
      ? ["What is 6 multiplied by 7?", "42", "The product is 42"]
      : bulkQuestionType === "MULTIPLE_CHOICE"
        ? ["Select all correct answers", "Correct answer one", "Other answer", "Correct answer two", "", "A|C", "Explain why both answers are correct"]
        : ["Single choice sample question", "First answer", "Second answer", "", "", "A", "Optional explanation"];
    downloadFile(`${header.join(",")}\r\n${sample.map(csvCell).join(",")}`, "text/csv;charset=utf-8", "vidyaexam-question-template.csv");
  };
  const submitBulk = async () => {
    const settingsErrors = validateBulkSettings();
    if (Object.keys(settingsErrors).length > 0) {
      toast.warning("Please review the upload settings", {
        description: Object.values(settingsErrors).slice(0, 3).join(" "),
      });
      return;
    }
    const validRows = bulkRows.filter((item) => !item.error);
    if (!validRows.length) {
      toast.error("No valid questions to import", { description: "Fix the highlighted CSV rows and upload the file again." });
      return;
    }
    if (role !== "SUPER_ADMIN" && !tenantId) {
      toast.error("Organization required", { description: "Select an active organization before importing questions." });
      return;
    }
    setBulkSubmitting(true);
    let succeeded = 0;
    const failures = [];
    bulkRows.filter((item) => item.error).forEach((item) => failures.push({ rowNumber: item.rowNumber, message: item.error }));
    for (const item of validRows) {
      try {
        await createQuestion(item.payload);
        succeeded += 1;
      } catch (requestError) {
        failures.push({ rowNumber: item.rowNumber, message: getApiErrorMessage(requestError, requestError.message) });
      }
    }
    setBulkSubmitting(false);
    setBulkResult({ succeeded, failures });
    refresh();
    if (failures.length) toast.warning("Bulk import finished with some failures", { description: `${succeeded} uploaded, ${failures.length} not uploaded. Review the report for details.` });
    else toast.success("Bulk import complete", { description: `${succeeded} question${succeeded === 1 ? "" : "s"} added successfully.` });
  };

  const hasFilters = Boolean(search.trim()) || [category, subject, topic, type, difficulty].some((value) => value !== "ALL");
  const openBulkModal = () => {
    setBulkRows([]);
    setBulkResult(null);
    setBulkFileName("");
    setBulkBatchId("");
    setBulkSettingsErrors({});
    setBulkOpen(true);
  };
  const validateBulkSettings = () => {
    const next = {};
    if (!bulkTopicId || !topics.some((item) => asTopicId(item) === bulkTopicId)) next.topic = "Choose a valid topic.";
    if (role !== "SUPER_ADMIN" && (!bulkBatchId || !batches.some((item) => asBatchId(item) === String(bulkBatchId)))) next.batch = "Choose a valid batch.";
    if (!QUESTION_TYPES.some((item) => item.value === bulkQuestionType)) next.questionType = "Choose a valid question type.";
    if (!DIFFICULTIES.includes(bulkDifficulty)) next.difficulty = "Choose a valid difficulty level.";
    if (bulkMarks.trim() === "" || !Number.isFinite(Number(bulkMarks)) || Number(bulkMarks) <= 0) next.marks = "Enter a marks value greater than 0.";
    if (bulkNegativeMarks.trim() === "" || !Number.isFinite(Number(bulkNegativeMarks)) || Number(bulkNegativeMarks) < 0) next.negativeMarks = "Enter a non-negative negative marks value.";
    else if (Number.isFinite(Number(bulkMarks)) && Number(bulkMarks) > 0 && Number(bulkNegativeMarks) > Number(bulkMarks)) next.negativeMarks = "Negative marks cannot exceed marks.";
    setBulkSettingsErrors(next);
    return next;
  };
  const heading = <PageHeader className={compact ? "qb-page-header qb-page-header--compact" : "qb-page-header"} eyebrow="QUESTION WORKSPACE" title="Question Bank" description="Create, organize, and review questions for your exam content." icon={FileQuestion} actions={<div className="qb-page-header-actions">
    <button type="button" className="qb-button qb-button--primary" onClick={() => { setFormInitial(null); setFormOpen(true); }} disabled={role !== "SUPER_ADMIN" && !tenantId}><Plus size={17} /> Create question</button>
    <button type="button" className="qb-button qb-button--secondary" onClick={openBulkModal} disabled={role !== "SUPER_ADMIN" && !tenantId}><Upload size={16} /> Add questions in bulk</button>
  </div>} />;
  const metrics = [
    { label: "Total questions", value: status === "ready" ? count : "—", tone: "navy", note: "Available in this bank", icon: BookOpen },
    { label: "Easy", value: status === "ready" ? difficultyCounts.EASY : "—", tone: "green", note: "In loaded results", icon: CircleAlert },
    { label: "Medium", value: status === "ready" ? difficultyCounts.MEDIUM : "—", tone: "amber", note: "In loaded results", icon: FileQuestion },
    { label: "Hard", value: status === "ready" ? difficultyCounts.HARD : "—", tone: "rose", note: "In loaded results", icon: CircleAlert },
  ];

  return <div className={`qb-page${compact ? " qb-page--compact" : ""}${role === "TEACHER" ? " teacher-workspace-page" : ""}`}>
    {heading}
    <section className="qb-kpi-grid" aria-label="Question bank summary">
      {metrics.map(({ label, value, tone, note, icon: Icon }) => <article className={`qb-kpi-card is-${tone}`} key={label}>
        <span className="qb-kpi-icon"><Icon size={19} aria-hidden="true" /></span>
        <span className="qb-kpi-label">{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </article>)}
    </section>
    <section className="qb-panel" aria-label="Question bank">
      <div className="qb-panel-heading"><div><h2>Questions</h2><p>{status === "ready" ? `${count} questions returned by the API` : "Manage your question library"}</p></div><div className="qb-panel-actions">
        <div className="qb-export-actions">
          <button type="button" className="qb-button qb-button--secondary" onClick={exportCsv}><FileSpreadsheet size={15} /> Export CSV</button>
          <button type="button" className="qb-button qb-button--secondary" onClick={exportPdf}><FileText size={15} /> Export PDF</button>
        </div>
        <button type="button" className="qb-count" onClick={refresh} disabled={status === "loading"} aria-label="Refresh questions"><BookOpen size={15} />{status === "ready" ? count : "—"}</button>
      </div></div>
      {status === "loading" && questions.length > 0 && <BrandLoader variant="section" className="ve-brand-loader--compact" message="Refreshing questions…" />}
      <div className="qb-filters">
        <label className="qb-search"><Search size={17} /><span className="qb-sr-only">Search questions</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search question text, topic, subject…" /><button type="button" onClick={() => setSearch("")} aria-label="Clear search" hidden={!search}><X size={15} /></button></label>
        <DropdownSelect value={category} onChange={(value) => { setCategory(value); setSubject("ALL"); }} ariaLabel="Filter by category" options={[{ value: "ALL", label: "All categories" }, ...categories.map((value) => ({ value, label: value }))]} />
        <DropdownSelect value={subject} onChange={setSubject} ariaLabel="Filter by subject" options={[{ value: "ALL", label: "All subjects" }, ...subjects.map((value) => ({ value, label: value }))]} />
        <DropdownSelect value={topic} onChange={setTopic} ariaLabel="Filter by topic" options={[{ value: "ALL", label: "All topics" }, ...topics.map((item) => ({ value: asTopicId(item), label: asTopicName(item) }))]} />
        <DropdownSelect value={type} onChange={setType} ariaLabel="Filter by question type" options={[{ value: "ALL", label: "All types" }, ...QUESTION_TYPES]} />
        <DropdownSelect value={difficulty} onChange={setDifficulty} ariaLabel="Filter by difficulty" options={[{ value: "ALL", label: "All difficulties" }, ...DIFFICULTIES.map((value) => ({ value, label: value.charAt(0) + value.slice(1).toLowerCase() }))]} />
        {hasFilters && <button type="button" className="qb-clear-button" onClick={clearFilters}>Clear filters</button>}
      </div>

      {status === "error" ? <div className="qb-state qb-state--error"><CircleAlert size={23} /><h3>Could not load questions</h3><p>{error}</p><button type="button" className="qb-button qb-button--secondary" onClick={refresh}>Try again</button></div>
        : status === "loading" && questions.length === 0 ? <BrandLoader variant="section" message="Loading questions…" />
          : questions.length === 0 ? <div className="qb-state"><span><BookOpen size={23} /></span><h3>No questions yet</h3><p>Create your first question to start building this question bank.</p><button className="qb-button qb-button--primary" type="button" onClick={() => setFormOpen(true)}><Plus size={16} />Create question</button></div>
            : filtered.length === 0 ? <div className="qb-state"><Search size={23} /><h3>No questions match these filters</h3><p>Try a different search or clear the selected filters.</p><button className="qb-button qb-button--secondary" type="button" onClick={clearFilters}>Clear filters</button></div>
              : <>
                <div className="qb-table-wrap"><table className="qb-table"><thead><tr><th><button type="button" className="qb-sort-button" onClick={() => toggleSort("question_text")}>Question <ArrowUpDown size={13} /></button></th><th>Batch / class</th><th><button type="button" className="qb-sort-button" onClick={() => toggleSort("category_name")}>Category / subject <ArrowUpDown size={13} /></button></th><th><button type="button" className="qb-sort-button" onClick={() => toggleSort("topic_name")}>Topic <ArrowUpDown size={13} /></button></th><th><button type="button" className="qb-sort-button" onClick={() => toggleSort("question_type")}>Type <ArrowUpDown size={13} /></button></th><th><button type="button" className="qb-sort-button" onClick={() => toggleSort("difficulty_level")}>Difficulty <ArrowUpDown size={13} /></button></th><th><button type="button" className="qb-sort-button" onClick={() => toggleSort("default_marks")}>Marks <ArrowUpDown size={13} /></button></th><th><button type="button" className="qb-sort-button" onClick={() => toggleSort("created_at")}>Created <ArrowUpDown size={13} /></button></th><th>Actions</th></tr></thead><tbody>
                  {visibleQuestions.map((item) => { const assignedBatch = batches.find((batch) => asBatchId(batch) === String(item.batch_id)); return <tr key={item.question_id}><td data-label="Question"><strong>{item.question_text || "Question text unavailable"}</strong></td><td data-label="Batch / class">{item.batch_name || (assignedBatch ? asBatchName(assignedBatch) : "—")}{item.batch_code ? <small> {item.batch_code}</small> : null}</td><td data-label="Category / subject">{[item.category_name, item.subject_name].filter(Boolean).join(" · ") || "—"}</td><td data-label="Topic">{item.topic_name || "—"}</td><td data-label="Type">{item.question_type?.replaceAll("_", " ") || "—"}</td><td data-label="Difficulty"><span className={`qb-difficulty is-${String(item.difficulty_level || "").toLowerCase()}`}>{item.difficulty_level || "—"}</span></td><td data-label="Marks">{item.default_marks ?? "—"}<small> / −{item.default_negative_marks ?? "—"}</small></td><td data-label="Created"><span className="qb-date"><CalendarDays size={14} />{item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}</span></td><td data-label="Actions"><div className="qb-row-actions"><button type="button" title="View question" aria-label="View question" onClick={() => openDetails(item)}><Eye size={16} /></button>{manageQuestion(item) && <><button type="button" title="Edit question" aria-label="Edit question" onClick={() => openEdit(item)}><Pencil size={16} /></button><button type="button" className="is-danger" title="Delete question" aria-label="Delete question" onClick={() => setDeleteTarget(item)}><Trash2 size={16} /></button></>}</div></td></tr>; })}
                </tbody></table></div>
                <div className="qb-pagination" aria-label="Question bank pagination"><label className="qb-page-size-label"><span>Rows per page</span><DropdownSelect className="qb-page-size-select" value={pageSize} onChange={(value) => setPageSize(Number(value))} ariaLabel="Rows per page" options={PAGE_SIZES.map((value) => ({ value, label: String(value) }))} /></label><span className="qb-page-range" aria-live="polite">{filtered.length ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} of ${filtered.length}` : "0 questions"}</span><div className="qb-page-navigation"><button type="button" aria-label="First page" disabled={page <= 1} onClick={() => setPage(1)}><ChevronsLeft size={17} /></button><button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={17} /></button><button type="button" aria-label="Next page" disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}><ChevronRight size={17} /></button><button type="button" aria-label="Last page" disabled={page >= pageCount} onClick={() => setPage(pageCount)}><ChevronsRight size={17} /></button></div></div>
              </>}
    </section>

    {formOpen && <Modal isOpen onClose={() => { if (!submitting) { setFormOpen(false); setFormInitial(null); } }} title={formInitial ? "Edit question" : "Create question"} description={formInitial ? "Update the supported question fields and answer options." : role === "SUPER_ADMIN" ? "Add a question to the question bank for the selected topic." : "Add a question to the question bank for the selected topic and batch."} size="xl" className="qb-modal qb-question-form-modal" closeOnEscape={!submitting} closeOnOverlay={!submitting}><QuestionForm key={formInitial?.question_id || "create"} initial={formInitial} topics={topics} topicsStatus={topicsStatus} topicsError={topicsError} onRetryTopics={refreshTopics} batches={batches} batchesStatus={batchesStatus} batchesError={batchesError} onRetryBatches={() => setBatchesRefresh((value) => value + 1)} isSuperAdmin={role === "SUPER_ADMIN"} submitting={submitting} canCreate={role === "SUPER_ADMIN" || Boolean(tenantId)} onCancel={() => { setFormOpen(false); setFormInitial(null); }} onSubmit={submitQuestion} /></Modal>}
    {bulkOpen && <Modal isOpen onClose={() => { if (!bulkSubmitting) { setBulkOpen(false); setBulkRows([]); setBulkResult(null); setBulkFileName(""); } }} title={bulkResult ? "Bulk upload results" : "Add questions in bulk"} description={bulkResult ? `Upload summary for ${bulkFileName || "your CSV file"}.` : "Upload a CSV, review its contents, then add valid questions to the bank."} size="lg" className="qb-modal qb-bulk-modal" closeOnEscape={!bulkSubmitting} closeOnOverlay={!bulkSubmitting}>
      <div className="qb-bulk-content">
        {!bulkResult ? <>
          <input ref={bulkFileRef} className="qb-sr-only" type="file" accept=".csv,text/csv" onChange={handleBulkFile} aria-label="Choose questions CSV file" />
          <div className="qb-bulk-settings" aria-label="Default question settings">
            <label className="qb-field">
              <span>Topic <b>*</b></span>
              <DropdownSelect
                className="qb-form-select"
                value={bulkTopicId}
                onChange={(value) => { setBulkTopicId(value); setBulkSettingsErrors((current) => ({ ...current, topic: "" })); }}
                options={[{ value: "", label: topicsStatus === "loading" ? "Loading topics…" : "Select a topic" }, ...topics.map((item) => ({ value: asTopicId(item), label: [asTopicName(item), item.subject_name].filter(Boolean).join(" · ") }))]}
                ariaLabel="Bulk upload default topic"
                ariaInvalid={Boolean(bulkSettingsErrors.topic)}
                disabled={topicsStatus !== "ready" || !topics.length || bulkRows.length > 0 || bulkSubmitting}
              />
              {bulkSettingsErrors.topic && <small className="qb-field-error">{bulkSettingsErrors.topic}</small>}
            </label>
            {role !== "SUPER_ADMIN" && <label className="qb-field">
              <span>Batch / class <b>*</b></span>
              <DropdownSelect
                className="qb-form-select"
                value={bulkBatchId}
                onChange={(value) => { setBulkBatchId(value); setBulkSettingsErrors((current) => ({ ...current, batch: "" })); }}
                options={[{ value: "", label: batchesStatus === "loading" ? "Loading batches…" : "Select a batch" }, ...batches.map((item) => ({ value: asBatchId(item), label: [asBatchName(item), item.batch_code].filter(Boolean).join(" · ") }))]}
                ariaLabel="Bulk upload batch or class"
                ariaInvalid={Boolean(bulkSettingsErrors.batch)}
                disabled={batchesStatus !== "ready" || !batches.length || bulkRows.length > 0 || bulkSubmitting}
              />
              {bulkSettingsErrors.batch && <small className="qb-field-error">{bulkSettingsErrors.batch}</small>}
              {batchesStatus === "loading" && <small className="qb-field-hint">Loading available batches…</small>}
              {batchesStatus === "error" && <small className="qb-field-error">{batchesError} <button type="button" className="qb-inline-action" onClick={() => setBatchesRefresh((value) => value + 1)}>Retry</button></small>}
              {batchesStatus === "ready" && !batches.length && <small className="qb-field-hint">Create a batch in Master before adding questions.</small>}
            </label>}
            <label className="qb-field">
              <span>Question type</span>
              <DropdownSelect className="qb-form-select" value={bulkQuestionType} onChange={(value) => { setBulkQuestionType(value); setBulkSettingsErrors((current) => ({ ...current, questionType: "" })); }} options={QUESTION_TYPES} ariaLabel="Bulk upload default question type" ariaInvalid={Boolean(bulkSettingsErrors.questionType)} disabled={bulkRows.length > 0 || bulkSubmitting} />
              {bulkSettingsErrors.questionType && <small className="qb-field-error">{bulkSettingsErrors.questionType}</small>}
            </label>
            <label className="qb-field">
              <span>Difficulty level</span>
              <DropdownSelect className="qb-form-select" value={bulkDifficulty} onChange={(value) => { setBulkDifficulty(value); setBulkSettingsErrors((current) => ({ ...current, difficulty: "" })); }} options={DIFFICULTIES.map((value) => ({ value, label: value.charAt(0) + value.slice(1).toLowerCase() }))} ariaLabel="Bulk upload default difficulty" ariaInvalid={Boolean(bulkSettingsErrors.difficulty)} disabled={bulkRows.length > 0 || bulkSubmitting} />
              {bulkSettingsErrors.difficulty && <small className="qb-field-error">{bulkSettingsErrors.difficulty}</small>}
            </label>
            <label className="qb-field">
              <span>Marks <b>*</b></span>
              <input type="number" min="0.01" step="any" required value={bulkMarks} onChange={(event) => { setBulkMarks(event.target.value); setBulkSettingsErrors((current) => ({ ...current, marks: "" })); }} aria-invalid={Boolean(bulkSettingsErrors.marks)} disabled={bulkRows.length > 0 || bulkSubmitting} />
              {bulkSettingsErrors.marks && <small className="qb-field-error">{bulkSettingsErrors.marks}</small>}
            </label>
            <label className="qb-field">
              <span>Negative marks <b>*</b></span>
              <input type="number" min="0" max={bulkMarks || undefined} step="any" required value={bulkNegativeMarks} onChange={(event) => { setBulkNegativeMarks(event.target.value); setBulkSettingsErrors((current) => ({ ...current, negativeMarks: "" })); }} aria-invalid={Boolean(bulkSettingsErrors.negativeMarks)} disabled={bulkRows.length > 0 || bulkSubmitting} />
              {bulkSettingsErrors.negativeMarks && <small className="qb-field-error">{bulkSettingsErrors.negativeMarks}</small>}
            </label>
          </div>
          <div className="qb-bulk-toolbar"><div><strong>CSV template</strong><p>Choose topic, {role !== "SUPER_ADMIN" ? "batch, " : ""}type, difficulty, marks, and negative marks above. The CSV contains question text, options, answers, and explanation. Use <code>correct_option</code> as A for single choice or A|C for multiple choice; numerical rows use <code>numerical_answer</code>. Explanation is optional.</p></div><button type="button" className="qb-text-button" onClick={downloadBulkTemplate}><Download size={15} /> Download template</button></div>
          <div className="qb-bulk-upload-zone"><span className="qb-bulk-upload-icon"><Upload size={21} /></span><div><strong>{bulkFileName || "Upload your question CSV"}</strong><p>{bulkFileName ? `${bulkRows.length} data rows found` : "CSV only · Maximum file size 2 MB · Up to 100 questions"}</p>{topicsStatus === "loading" && <p>Loading available topics…</p>}{topicsStatus === "error" && <p className="qb-field-error">{topicsError || "Topics could not be loaded. Retry from the Question Bank first."}</p>}</div><button type="button" className="qb-button qb-button--secondary" onClick={() => bulkFileRef.current?.click()} disabled={bulkSubmitting}><FileSpreadsheet size={16} /> {bulkFileName ? "Choose another file" : "Choose CSV"}</button></div>
          {bulkRows.length > 0 && <>
            <div className="qb-bulk-counts"><span className="is-valid">{bulkRows.filter((item) => !item.error).length} valid</span><span className="is-invalid">{bulkRows.filter((item) => item.error).length} invalid</span><span>{bulkRows.length} total</span></div>
            <div className="qb-bulk-preview" role="region" aria-label="CSV validation preview" tabIndex="0">
              <table><thead><tr><th>Row</th><th>Question type</th><th>Question</th><th>Topic</th><th>Validation</th></tr></thead><tbody>{bulkRows.map((item) => <tr key={item.rowNumber} className={item.error ? "is-invalid" : "is-valid"}><td>{item.rowNumber}</td><td>{item.payload.question_type.replaceAll("_", " ")}</td><td>{item.payload.question_text || "—"}</td><td>{topics.find((topicItem) => asTopicId(topicItem) === String(item.payload.topic_id)) ? asTopicName(topics.find((topicItem) => asTopicId(topicItem) === String(item.payload.topic_id))) : "—"}</td><td>{item.error || "Ready to upload"}</td></tr>)}</tbody></table>
            </div>
          </>}
          <div className="qb-modal-actions"><button type="button" className="qb-button qb-button--secondary" onClick={() => { setBulkOpen(false); setBulkRows([]); setBulkResult(null); setBulkFileName(""); }} disabled={bulkSubmitting}>Cancel</button><button type="button" className="qb-button qb-button--primary" onClick={submitBulk} disabled={bulkSubmitting || !bulkRows.some((item) => !item.error)} aria-busy={bulkSubmitting}><Upload size={16} /> {bulkSubmitting ? "Uploading…" : `Upload ${bulkRows.filter((item) => !item.error).length} questions`}</button></div>
        </> : <>
          <input ref={bulkFileRef} className="qb-sr-only" type="file" accept=".csv,text/csv" onChange={handleBulkFile} aria-label="Choose another questions CSV file" />
          <div className="qb-bulk-result-cards"><article className="is-valid"><strong>{bulkResult.succeeded}</strong><span>Successfully uploaded</span></article><article className="is-invalid"><strong>{bulkResult.failures.length}</strong><span>Not uploaded</span></article></div>
          {bulkResult.failures.length > 0 && <div className="qb-bulk-preview qb-bulk-failures" role="region" aria-label="Questions not uploaded" tabIndex="0"><table><thead><tr><th>Row</th><th>Reason not uploaded</th></tr></thead><tbody>{bulkResult.failures.map((failure) => <tr className="is-invalid" key={failure.rowNumber}><td>{failure.rowNumber}</td><td>{failure.message}</td></tr>)}</tbody></table></div>}
          <div className="qb-modal-actions"><button type="button" className="qb-button qb-button--secondary" onClick={() => bulkFileRef.current?.click()}>Upload another CSV</button><button type="button" className="qb-button qb-button--primary" onClick={() => { setBulkOpen(false); setBulkRows([]); setBulkResult(null); }}>Done</button></div>
        </>}
      </div>
    </Modal>}
    {detailState && <Modal isOpen onClose={() => setDetailState(null)} title="Question details" description="Review question content and answer key." size="lg" className="qb-modal"><div className="qb-modal-body">{detailState.status === "loading" ? <BrandLoader variant="section" message={detailState.mode === "edit" ? "Loading question for editing…" : "Loading question details…"} /> : detailState.status === "error" ? <div className="qb-state qb-state--error"><CircleAlert size={22} /><h3>Could not load question details</h3><p>{detailState.error}</p><button type="button" className="qb-button qb-button--secondary" onClick={() => openDetails(detailState.item)}>Try again</button></div> : <DetailContent question={detailState.question} />}</div><div className="qb-modal-actions"><button type="button" className="qb-button qb-button--secondary" onClick={() => setDetailState(null)}>Close</button></div></Modal>}
    {deleteTarget && <Modal isOpen onClose={() => !deleting && setDeleteTarget(null)} title="Delete question?" description="Confirm whether this question should be removed from the question bank." size="sm" className="qb-modal" closeOnEscape={!deleting} closeOnOverlay={!deleting}><div className="qb-delete-copy"><p>Are you sure you want to delete this question?</p><blockquote>{deleteTarget.question_text}</blockquote><small>Questions used by exams may be affected. The backend determines how this record is removed.</small></div><div className="qb-modal-actions"><button type="button" className="qb-button qb-button--secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button><button type="button" className="qb-button qb-button--danger" onClick={confirmDelete} disabled={deleting} aria-busy={deleting}>{deleting ? "Deleting…" : "Delete question"}</button></div></Modal>}
  </div>;
}
