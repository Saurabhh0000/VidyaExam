import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CircleAlert, Clock3, Flag, Send } from "lucide-react";
import BrandLoader from "../../../shared/components/ui/BrandLoader";
import PageHeader from "../../../shared/components/ui/PageHeader";
import toast from "../../../shared/components/ui/toast";
import { getExamErrorMessage, getExamById, saveExamResponse, startExam, submitExamAttempt } from "../../exams/services/exams.service";
import "../styles/my-exams.css";

const getId = (question) => String(question?.question_id ?? question?.id ?? "");
const formatTime = (seconds) => `${Math.floor(Math.max(0, seconds) / 60).toString().padStart(2, "0")}:${(Math.max(0, seconds) % 60).toString().padStart(2, "0")}`;
const isQuestionAnswered = (question, answer = {}) => {
  const type = String(question?.question_type || "").toUpperCase();
  if (type === "MULTIPLE_CHOICE") return (answer.selected_option_ids || []).length > 0;
  if (type === "NUMERICAL") return String(answer.answer_text || "").trim().length > 0;
  return Boolean(answer.selected_option_id);
};

export default function StudentExamAttemptPage() {
  const { examId, attemptId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(state?.start || null);
  const [loading, setLoading] = useState(!state?.start);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  const [activeSection, setActiveSection] = useState("");
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [remaining, setRemaining] = useState(Number(state?.start?.attempt?.remaining_seconds) || 0);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        let data = state?.start;
        if (!data) {
          data = await startExam(examId);
          const returnedAttemptId = data?.attempt?.attempt_id ?? data?.data?.attempt?.attempt_id;
          if (returnedAttemptId && String(returnedAttemptId) !== String(attemptId)) {
            navigate(`/student/dashboard/exams/${encodeURIComponent(examId)}/attempt/${encodeURIComponent(returnedAttemptId)}`, { replace: true, state: { start: data } });
            return;
          }
        }
        if (cancelled) return;
        const examData = data?.exam ? data : await getExamById(examId).then((exam) => ({ ...data, exam }));
        setAttempt(examData);
        const seconds = Number(examData?.attempt?.remaining_seconds ?? examData?.attempt?.total_duration_seconds) || (Number(examData?.attempt?.duration_minutes ?? examData?.exam?.duration_minutes) * 60);
        setRemaining(seconds);
        const initialAnswers = {};
        (examData?.saved_responses || []).forEach((saved) => {
          const id = String(saved.question_id || "");
          if (id) initialAnswers[id] = { selected_option_id: saved.selected_option_id || "", selected_option_ids: saved.selected_option_ids || [], answer_text: saved.answer_text || "", is_marked_for_review: Boolean(saved.is_marked_for_review) };
        });
        setAnswers(initialAnswers);
        setActiveSection(String(examData?.sections?.[0]?.section_id || ""));
      } catch (requestError) {
        if (!cancelled) setError(getExamErrorMessage(requestError, requestError.message || "This exam could not be opened."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [examId, attemptId, navigate, state]);

  const sections = attempt?.sections || [];
  const questions = attempt?.questions?.length ? attempt.questions : sections.flatMap((section) => (section.questions || section.question_mappings || []).map((entry) => ({ ...(entry.question || entry), section_id: section.section_id })));
  const sectionQuestions = useMemo(() => questions.filter((question) => !activeSection || String(question.section_id ?? question.exam_section_id ?? sections[0]?.section_id ?? "") === activeSection), [questions, activeSection, sections]);
  const currentQuestion = sectionQuestions[activeQuestionIndex];
  const currentQuestionId = currentQuestion ? getId(currentQuestion) : "";
  const currentAnswer = answers[currentQuestionId] || {};
  const actualAttemptId = attempt?.attempt?.attempt_id || attemptId;

  const finish = useCallback(async (automatic = false) => {
    if (submitLock.current || !actualAttemptId) return;
    submitLock.current = true;
    setSubmitting(true);
    try {
      const totalSeconds = Number(attempt?.attempt?.total_duration_seconds) || Number(attempt?.attempt?.duration_minutes ?? attempt?.exam?.duration_minutes) * 60 || 0;
      const spent = Math.max(0, totalSeconds - remaining);
      await submitExamAttempt(actualAttemptId, spent);
      navigate(`/student/dashboard/exams/result/${encodeURIComponent(actualAttemptId)}`, { replace: true });
    } catch (requestError) {
      submitLock.current = false;
      setSubmitting(false);
      toast.error("Could not submit exam", { description: getExamErrorMessage(requestError, requestError.message) });
      if (automatic) setRemaining(1);
    }
  }, [actualAttemptId, attempt, remaining, navigate]);

  useEffect(() => {
    if (loading || error || submitting || !attempt) return undefined;
    const timer = window.setInterval(() => setRemaining((value) => {
      if (value <= 1) {
        window.clearInterval(timer);
        finish(true);
        return 0;
      }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [loading, error, submitting, attempt, finish]);

  const saveAnswer = async (question, answer) => {
    const id = getId(question);
    if (!id || !actualAttemptId) return;
    const type = String(question.question_type || "").toUpperCase();
    const payload = { question_id: id, is_marked_for_review: Boolean(answer.is_marked_for_review), time_spent_seconds: Math.max(0, Math.floor((Date.now() - startedAt.current) / 1000)) };
    if (type === "MULTIPLE_CHOICE") payload.selected_option_ids = answer.selected_option_ids || [];
    else if (type === "NUMERICAL") payload.answer_text = answer.answer_text || "";
    else payload.selected_option_id = answer.selected_option_id || "";
    setAnswers((previous) => ({ ...previous, [id]: answer }));
    setSaving(true);
    try {
      await saveExamResponse(actualAttemptId, payload);
    } catch (requestError) {
      toast.error("Answer not saved", { description: getExamErrorMessage(requestError, requestError.message) });
    } finally {
      setSaving(false);
    }
  };

  const changeSection = (id) => { setActiveSection(String(id)); setActiveQuestionIndex(0); };
  if (loading) return <main className="sd-my-exams"><BrandLoader variant="content" message="Preparing your exam…" /></main>;
  if (error) return <main className="sd-my-exams"><section className="sd-my-exams__state is-error"><CircleAlert size={24} /><h2>Could not open exam</h2><p>{error}</p><button className="sd-my-exams__refresh" type="button" onClick={() => navigate("/student/dashboard/exams")}>Back to My Test</button></section></main>;

  const exam = attempt?.exam || {};
  return <main className="sd-my-exams sd-exam-attempt">
    <PageHeader eyebrow="EXAM IN PROGRESS" title={exam.title || "Your exam"} description="Your answers save as you go. You can move between questions before submitting." icon={Clock3} actions={<span className={`sd-exam-attempt__timer${remaining < 300 ? " is-low" : ""}`}><Clock3 size={17} />{formatTime(remaining)}</span>} />
    {attempt?.exam?.instructions && <aside className="sd-exam-attempt__instructions">{attempt.exam.instructions}</aside>}
    {sections.length > 1 && <nav className="sd-exam-attempt__sections" aria-label="Exam sections">{sections.map((section) => <button key={section.section_id} className={String(section.section_id) === activeSection ? "is-active" : ""} type="button" onClick={() => changeSection(section.section_id)}>{section.section_name}</button>)}</nav>}
    <section className="sd-exam-attempt__workspace">
      <aside className="sd-exam-attempt__question-nav"><strong>Questions</strong><div>{sectionQuestions.map((question, index) => {
        const answer = answers[getId(question)] || {};
        const classes = [index === activeQuestionIndex && "is-current", isQuestionAnswered(question, answer) && "is-answered", answer.is_marked_for_review && "is-marked"].filter(Boolean).join(" ");
        return <button key={getId(question)} type="button" className={classes} onClick={() => setActiveQuestionIndex(index)} aria-label={`Question ${index + 1}${answer.is_marked_for_review ? ", marked for review" : ""}${isQuestionAnswered(question, answer) ? ", answered" : ", unanswered"}`}>{index + 1}</button>;
      })}</div><small>{sectionQuestions.filter((question) => isQuestionAnswered(question, answers[getId(question)])).length} answered · {sectionQuestions.length} total</small></aside>
      <article className="sd-exam-attempt__question">
        {currentQuestion ? <>
          <div className="sd-exam-attempt__question-meta"><span>Question {activeQuestionIndex + 1} of {sectionQuestions.length}</span><span>{currentQuestion.marks ?? currentQuestion.default_marks ?? "—"} marks</span></div>
          <h2>{currentQuestion.question_text || currentQuestion.text || "Question"}</h2>
          {currentQuestion.question_type === "NUMERICAL" ? <label className="sd-exam-attempt__numeric"><span>Your answer</span><input inputMode="decimal" value={currentAnswer.answer_text || ""} onChange={(event) => setAnswers((previous) => ({ ...previous, [currentQuestionId]: { ...currentAnswer, answer_text: event.target.value } }))} onBlur={(event) => saveAnswer(currentQuestion, { ...currentAnswer, answer_text: event.target.value })} placeholder="Enter a number" /></label> : <div className="sd-exam-attempt__options">{(currentQuestion.options || []).map((option) => {
            const optionId = String(option.option_id ?? option.id ?? option.option_key ?? "");
            const multiple = String(currentQuestion.question_type || "").toUpperCase() === "MULTIPLE_CHOICE";
            const checked = multiple ? (currentAnswer.selected_option_ids || []).includes(optionId) : String(currentAnswer.selected_option_id || "") === optionId;
            return <label key={optionId} className={checked ? "is-selected" : ""}><input type={multiple ? "checkbox" : "radio"} name={`question-${currentQuestionId}`} checked={checked} onChange={() => {
              const selected = multiple ? [...new Set([...(currentAnswer.selected_option_ids || []), optionId])] : undefined;
              if (multiple && checked) saveAnswer(currentQuestion, { ...currentAnswer, selected_option_ids: (currentAnswer.selected_option_ids || []).filter((value) => value !== optionId) });
              else saveAnswer(currentQuestion, multiple ? { ...currentAnswer, selected_option_ids: selected } : { ...currentAnswer, selected_option_id: optionId });
            }} /><span className="sd-exam-attempt__option-key">{option.option_key || "•"}</span><span>{option.option_text || option.text || option.label}</span></label>;
          })}</div>}
          <button type="button" className={`sd-exam-attempt__review${currentAnswer.is_marked_for_review ? " is-marked" : ""}`} onClick={() => saveAnswer(currentQuestion, { ...currentAnswer, is_marked_for_review: !currentAnswer.is_marked_for_review })}><Flag size={15} />{currentAnswer.is_marked_for_review ? "Marked for review" : "Mark for review"}</button>
          <footer><button type="button" className="sd-my-exams__refresh" onClick={() => setActiveQuestionIndex((value) => Math.max(0, value - 1))} disabled={activeQuestionIndex === 0}><ArrowLeft size={16} />Previous</button><span>{saving ? "Saving…" : "Answers save automatically"}</span><button type="button" className="sd-my-exams__start" onClick={() => setActiveQuestionIndex((value) => Math.min(sectionQuestions.length - 1, value + 1))} disabled={activeQuestionIndex >= sectionQuestions.length - 1}>Next<ArrowRight size={16} /></button></footer>
        </> : <div className="sd-my-exams__state"><CircleAlert size={22} /><h2>No questions in this section</h2><p>Return to your exams and contact your teacher if you think this is a mistake.</p></div>}
      </article>
    </section>
    <div className="sd-exam-attempt__submit"><span>{saving ? "Saving your latest answer…" : "Check your answers before you submit."}</span><button type="button" className="sd-exam-attempt__submit-button" onClick={() => finish(false)} disabled={submitting || saving}>{submitting ? "Submitting…" : <><Send size={16} />Submit exam</>}</button></div>
  </main>;
}
