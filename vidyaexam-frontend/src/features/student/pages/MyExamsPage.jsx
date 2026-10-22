import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, CircleAlert, Clock3, Eye, RefreshCw, Play, ClipboardCheck } from "lucide-react";
import BrandLoader from "../../../shared/components/ui/BrandLoader";
import Modal from "../../../shared/components/ui/Modal";
import PageHeader from "../../../shared/components/ui/PageHeader";
import toast from "../../../shared/components/ui/toast";
import { getExamById, getExamErrorMessage, getMyExams, getMyExamHistory, startExam } from "../../exams/services/exams.service";
import "../styles/my-exams.css";

function formatDate(value) {
  if (!value) return "Schedule to be announced";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Schedule to be announced" : date.toLocaleString();
}

export default function MyExamsPage() {
  const [exams, setExams] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [detail, setDetail] = useState(null);
  const [history, setHistory] = useState([]);
  const [studentBatchesCount, setStudentBatchesCount] = useState(null);
  const [startingId, setStartingId] = useState("");
  const navigate = useNavigate();
  const retry = useCallback(() => setRefreshKey((value) => value + 1), []);

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

    getMyExamHistory()
      .then((attempts) => {
        if (active) setHistory(attempts);
      })
      .catch(() => {
        if (active) setHistory([]);
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
          : <section className="sd-my-exams__list" aria-label="Available exams">{exams.map((exam) => <article className="sd-my-exams__card" key={exam.exam_id}>
            <div className="sd-my-exams__card-head"><div><span className="sd-my-exams__eyebrow">{exam.category_name || "Exam"}</span><h2>{exam.title}</h2></div><span className="sd-my-exams__status">Published</span></div>
            <p>{exam.description || "No exam description provided."}</p>
            <div className="sd-my-exams__meta"><span><Clock3 size={15} />{exam.duration_minutes} minutes</span><span>{exam.total_marks} total marks</span><span>{exam.passing_marks} passing marks</span><span><CalendarDays size={15} />{formatDate(exam.starts_at)}</span></div>
            <div className="sd-my-exams__batches">{(exam.targeted_batches || exam.assigned_batches || []).map((batch) => <span key={batch.batch_id}>{batch.batch_name || "Your batch"}</span>)}</div>
            <div className="sd-my-exams__actions"><button type="button" className="sd-my-exams__refresh" onClick={() => showDetails(exam)}><Eye size={16} />Details</button><button type="button" className="sd-my-exams__start" onClick={() => beginExam(exam)} disabled={startingId === exam.exam_id}><Play size={16} />{startingId === exam.exam_id ? "Starting…" : "Start test"}</button></div>
          </article>)}</section>}
    {status === "ready" && <section className="sd-my-exams__history"><div className="sd-my-exams__history-heading"><span><ClipboardCheck size={18} /></span><div><h2>Attempt history</h2><p>Your submitted exams and scores.</p></div></div>{history.length ? <div className="sd-my-exams__history-list">{history.map((item) => <article key={item.attempt_id}><div><strong>{item.exam_title || "Exam attempt"}</strong><span>{item.category_name || ""}</span></div><div className="sd-my-exams__history-score"><strong>{item.score_obtained ?? "—"}<small> / {item.total_marks ?? "—"}</small></strong><span className={item.is_passed ? "is-pass" : "is-fail"}>{item.is_passed ? "Passed" : "Not passed"} · {item.percentage ?? 0}%</span></div><time>{formatDate(item.submitted_at)}</time><button type="button" className="sd-my-exams__refresh" onClick={() => navigate(`/student/dashboard/exams/result/${encodeURIComponent(item.attempt_id)}`)}>View result</button></article>)}</div> : <p className="sd-my-exams__history-empty">Your submitted attempts will appear here.</p>}</section>}
    {detail && <Modal isOpen onClose={() => setDetail(null)} title={detail.exam.title} description="Exam schedule, instructions, and sections." size="lg" className="sd-my-exams-modal">
      {detail.status === "loading" ? <BrandLoader variant="section" message="Loading exam details…" />
        : detail.status === "error" ? <section className="sd-my-exams__state is-error" role="alert"><CircleAlert size={22} /><p>{detail.error}</p><button type="button" className="sd-my-exams__refresh" onClick={() => showDetails(detail.exam)}>Try again</button></section>
          : <div className="sd-my-exams__detail"><div className="sd-my-exams__meta"><span><Clock3 size={15} />{detail.data.duration_minutes} minutes</span><span>{detail.data.total_marks} total marks</span><span>{detail.data.passing_marks} passing marks to pass</span><span><CalendarDays size={15} />{formatDate(detail.data.starts_at)}</span></div>{detail.data.instructions && <section><h3>Instructions</h3><p>{detail.data.instructions}</p></section>}<section><h3>Assigned batches</h3><div className="sd-my-exams__batches">{(detail.data.targeted_batches || detail.data.assigned_batches || []).map((batch) => <span key={batch.batch_id}>{batch.batch_name}</span>)}</div></section><section><h3>Sections</h3><ol>{(detail.data.sections || []).map((section) => <li key={section.section_id}>{section.section_name}{section.total_questions != null && <small>{section.total_questions} questions</small>}</li>)}</ol></section><button type="button" className="sd-my-exams__start" onClick={() => { const exam = detail.exam; setDetail(null); beginExam(exam); }}><Play size={16} />Start test</button></div>}
    </Modal>}
  </main>;
}
