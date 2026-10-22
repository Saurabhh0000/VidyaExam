import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, CircleAlert, FileQuestion, Plus, RefreshCw, Target } from "lucide-react";
import useAuthState from "../../auth/utils/useAuthState";
import useQuestionBankData from "../../question-bank/hooks/useQuestionBankData";
import { TEACHER_DASHBOARD } from "../../../app/roleRoutes";
import BrandLoader from "../../../shared/components/ui/BrandLoader";
import PageHeader from "../../../shared/components/ui/PageHeader";
import "../../question-bank/styles/question-bank.css";

export default function TeacherDashboard() {
  const { user } = useAuthState();
  const { questions, count, status, error, refresh } = useQuestionBankData("TEACHER", user?.activeTenantId, { loadTopics: false });
  const firstName = (user?.name || "Teacher").trim().split(/\s+/)[0];
  const medium = questions.filter((question) => question.difficulty_level === "MEDIUM").length;
  const advanced = questions.filter((question) => question.difficulty_level === "HARD").length;
  const recent = [...questions].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 5);

  return <div className="teacher-dashboard qb-page teacher-workspace-page">
    <PageHeader className="td-page-header" eyebrow="TEACHER WORKSPACE" title={`Welcome back, ${firstName}`} description="Build and manage the questions that help your learners prepare with confidence." icon={BookOpen} actions={<div className="qb-page-header-actions"><Link className="qb-button qb-button--secondary" to={`${TEACHER_DASHBOARD}/questions`}>Open Question Bank <ArrowRight size={16} /></Link><Link className="qb-button qb-button--primary" to={`${TEACHER_DASHBOARD}/questions/create`}><Plus size={17} /> Create question</Link></div>} />
    <section className="td-metrics" aria-label="Question overview">
      <article><span><FileQuestion size={19} /></span><div><small>Questions in available results</small><strong>{status === "ready" ? count : status === "loading" ? "…" : "—"}</strong><p>From the question bank API</p></div></article>
      <article><span className="is-mint"><Target size={19} /></span><div><small>Medium difficulty</small><strong>{status === "ready" ? medium : "—"}</strong><p>In the fetched question set</p></div></article>
      <article><span className="is-amber"><Target size={19} /></span><div><small>Hard difficulty</small><strong>{status === "ready" ? advanced : "—"}</strong><p>In the fetched question set</p></div></article>
    </section>
    <section className="qb-panel td-recent"><div className="qb-panel-heading"><div><h2>Recent questions</h2><p>Latest questions available to your account.</p></div><button className="qb-button qb-button--secondary" type="button" onClick={refresh} disabled={status === "loading"}><RefreshCw size={15} /> Refresh</button></div>
      {status === "error" ? <div className="qb-state qb-state--error"><CircleAlert size={22} /><h3>Could not load recent questions</h3><p>{error}</p><button className="qb-button qb-button--secondary" type="button" onClick={refresh}>Try again</button></div> : status === "loading" && !questions.length ? <BrandLoader variant="section" message="Loading recent questions…" /> : <>{status === "loading" && <BrandLoader variant="section" className="ve-brand-loader--compact" message="Refreshing recent questions…" />}{recent.length ? <div className="td-recent-list">{recent.map((question) => {
        const creatorId = question.created_by ?? question.created_by_user_id ?? question.creator_id;
        const canEdit = creatorId != null && String(creatorId) === String(user?.userId);
        return <article key={question.question_id}><span className="td-question-icon"><FileQuestion size={17} /></span><div><strong>{question.question_text || "Question text unavailable"}</strong><p>{question.topic_name || "Topic unavailable"} · {question.difficulty_level || "Difficulty unavailable"} · {question.default_marks ?? "—"} marks</p></div><div className="td-recent-actions"><time>{question.created_at ? new Date(question.created_at).toLocaleDateString() : "—"}</time><Link to={`${TEACHER_DASHBOARD}/questions?viewId=${encodeURIComponent(question.question_id)}`}>View</Link>{canEdit && <Link to={`${TEACHER_DASHBOARD}/questions?editId=${encodeURIComponent(question.question_id)}`}>Edit</Link>}</div></article>;
      })}</div> : <div className="qb-state"><span><BookOpen size={22} /></span><h3>No questions yet</h3><p>Create your first question to populate the question bank.</p><Link className="qb-button qb-button--primary" to={`${TEACHER_DASHBOARD}/questions/create`}><Plus size={16} />Create question</Link></div>}</>}
      {status === "ready" && questions.length > 0 && <div className="td-view-all"><Link to={`${TEACHER_DASHBOARD}/questions`}>Browse Question Bank <ArrowRight size={16} /></Link></div>}
    </section>
  </div>;
}
