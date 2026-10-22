import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Award, CalendarCheck, CircleAlert, CircleCheck, ClipboardList, Percent, X } from "lucide-react";
import BrandLoader from "../../../shared/components/ui/BrandLoader";
import PageHeader from "../../../shared/components/ui/PageHeader";
import { getExamErrorMessage, getExamResult } from "../../exams/services/exams.service";
import "../styles/my-exams.css";

const value = (...values) => values.find((item) => item !== undefined && item !== null);

const asCount = (...values) => {
  const candidate = value(...values);
  if (candidate === undefined || candidate === null || candidate === "") return null;
  const count = Number(candidate);
  return Number.isFinite(count) ? count : null;
};

const normalizeList = (items) => {
  if (Array.isArray(items)) return items;
  if (!items || typeof items !== "object") return [];
  const nested = items.items || items.questions || items.sections || items.results || items.data;
  if (nested && nested !== items) return normalizeList(nested);
  return Object.values(items);
};

const questionWasAnswered = (question) => {
  const answeredFlag = value(question.is_attempted, question.attempted, question.is_answered);
  if (typeof answeredFlag === "boolean") return answeredFlag;
  return Boolean(value(
    question.selected_option_id,
    question.selected_option_ids,
    question.selected_option_text,
    question.selected_answer,
    question.answer_text,
    question.student_answer,
  ));
};

const getSectionAttemptCount = (section, index, sections, review, overallAttempted) => {
  const explicitCount = asCount(
    section.total_attempted,
    section.attempted_questions,
    section.questions_attempted,
    section.attempted_count,
    section.answered_count,
    section.total_answered,
    section.answered_questions,
    section.attempted,
  );
  if (explicitCount !== null) return explicitCount;

  const sectionId = value(section.section_id, section.id);
  const sectionName = section.section_name || section.name;
  const inSection = review.filter((question) => {
    const questionSection = question.section || question.exam_section || question.question?.section;
    const questionSectionId = value(question.section_id, question.exam_section_id, questionSection?.section_id, questionSection?.id);
    const questionSectionName = value(question.section_name, questionSection?.section_name, questionSection?.name);
    return (sectionId && questionSectionId === sectionId) || (sectionName && questionSectionName === sectionName);
  });
  if (inSection.length) return inSection.filter(questionWasAnswered).length;
  if (Array.isArray(section.questions)) return section.questions.filter(questionWasAnswered).length;

  // Some result APIs return the attempt total only at scorecard level. It can
  // be assigned accurately when the exam contains a single section.
  if (sections.length === 1 && overallAttempted !== null) return overallAttempted;
  return null;
};

const getSectionQuestionCount = (section) => asCount(
  section.total_questions,
  section.question_count,
  section.total_question_count,
  section.questions_count,
  section.questions?.length,
);

const getSectionCorrectCount = (section, questions, overallCorrect, isSingleSection) => {
  const count = asCount(section.total_correct, section.correct_questions, section.correct_count, section.questions_correct, section.correct);
  if (count !== null) return count;
  if (questions.length) return questions.filter((question) => question.is_correct === true).length;
  if (Array.isArray(section.questions)) return section.questions.filter((question) => question.is_correct === true).length;
  return isSingleSection ? overallCorrect : null;
};

const getQuestionOptions = (item) => normalizeList(item.options || item.question_options || item.question?.options);

const getAnswerLabel = (item, correct = false) => {
  const options = getQuestionOptions(item);
  if (correct) {
    const correctOptions = options.filter((option) => option.is_correct === true);
    if (correctOptions.length) return correctOptions.map((option) => `${option.option_key ? `${option.option_key}. ` : ""}${option.option_text || option.text || ""}`).join(", ");
    return item.correct_option_text || item.correct_answer || item.correct_option || "—";
  }

  const selectedId = value(item.selected_option_id, item.selected_option?.option_id, item.selected_option?.id);
  const selectedOption = options.find((option) => value(option.option_id, option.id) === selectedId);
  if (selectedOption) return `${selectedOption.option_key ? `${selectedOption.option_key}. ` : ""}${selectedOption.option_text || selectedOption.text || ""}`;
  return item.selected_option_text || item.selected_answer || item.answer_text || item.student_answer || selectedId || "Not answered";
};

const getSectionQuestions = (section, review, sections = [], sectionIndex = 0) => {
  const nestedQuestions = section.questions
    || section.question_reviews
    || section.questions_review
    || section.question_analysis
    || section.question_review
    || section.analysis;
  if (nestedQuestions) {
    const list = normalizeList(nestedQuestions);
    if (list.length) return list;
  }
  const sectionId = value(section.section_id, section.id);
  const sectionName = section.section_name || section.name;
  const sectionOrder = value(section.section_order, section.order);
  const matchedQuestions = review.filter((question) => {
    const questionSection = question.section || question.exam_section || question.question?.section;
    const questionSectionId = value(question.section_id, question.exam_section_id, questionSection?.section_id, questionSection?.id);
    const questionSectionName = value(question.section_name, questionSection?.section_name, questionSection?.name);
    const questionSectionOrder = value(question.section_order, questionSection?.section_order);
    const questionId = value(question.question_id, question.question?.question_id, question.id);
    const sectionQuestionIds = section.question_ids || section.questionIds || [];
    return (Array.isArray(sectionQuestionIds) && questionId && sectionQuestionIds.includes(questionId))
      || (sectionId && questionSectionId === sectionId)
      || (sectionName && questionSectionName === sectionName)
      || (sectionOrder !== undefined && questionSectionOrder === sectionOrder);
  });
  if (matchedQuestions.length) return matchedQuestions;
  if (sections.length === 1) return review;

  // Some APIs return a flat review list without section IDs. In that case,
  // split it by each section's question total, preserving exam order.
  const reviewHasSectionReference = review.some((question) => question.section_id || question.exam_section_id || question.section_name || question.section?.section_id || question.exam_section?.section_id);
  if (!reviewHasSectionReference && sections.length > 1) {
    const start = sections.slice(0, sectionIndex).reduce((total, item) => total + (getSectionQuestionCount(item) || 0), 0);
    const count = getSectionQuestionCount(section);
    if (count !== null && count > 0) return review.slice(start, start + count);
  }
  return [];
};

export default function StudentExamResultPage() {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);
  const [analysisSection, setAnalysisSection] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    getExamResult(attemptId, { signal: controller.signal })
      .then(setResult)
      .catch((requestError) => {
        if (requestError?.name !== "CanceledError") setError(getExamErrorMessage(requestError, requestError.message || "Your result could not be loaded."));
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attemptId]);

  useEffect(() => {
    if (!analysisSection) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setAnalysisSection(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [analysisSection]);

  if (loading) return <main className="sd-my-exams"><BrandLoader variant="content" message="Loading your scorecard…" /></main>;
  if (error) return <main className="sd-my-exams"><section className="sd-my-exams__state is-error"><CircleAlert size={24} /><h2>Could not load result</h2><p>{error}</p><Link className="sd-my-exams__refresh" to="/student/dashboard/exams"><ArrowLeft size={16} />Back to My Test</Link></section></main>;

  const score = result?.scorecard || result?.summary || result || {};
  const review = normalizeList(result?.questions || result?.question_reviews || result?.questions_review || result?.question_review || result?.question_analysis || result?.question_details || result?.question_results || result?.solutions || result?.review);
  const sections = normalizeList(result?.section_analysis || result?.sections);
  const overallAttempted = asCount(
    score.total_attempted,
    score.attempted_questions,
    score.attempted_count,
    score.total_answered,
    Number(score.total_correct) + Number(score.total_incorrect),
  );
  const passed = value(score.is_passed, score.passed);
  const percentageValue = Math.max(0, Math.min(100, Number(score.percentage) || 0));
  const modalQuestions = analysisSection
    ? getSectionQuestions(analysisSection, review, sections, sections.indexOf(analysisSection))
    : [];
  return <main className="sd-my-exams sd-exam-result">
    <PageHeader eyebrow="EXAM RESULTS" title={result?.exam_title || result?.title || "Your scorecard"} description="Review your score, section breakdown, and answer explanations." icon={Award} actions={<Link className="sd-my-exams__refresh" to="/student/dashboard/exams"><ArrowLeft size={16} />My Test</Link>} />
    <section className="sd-exam-result__summary">
      <article className="sd-exam-result__kpi is-score">
        <div className="sd-exam-result__kpi-head"><span className="sd-exam-result__kpi-icon"><Award size={19} /></span><span>Score</span></div>
        <strong>{value(score.score_obtained, score.marks_obtained, score.marks, "—")}<small> / {value(score.total_marks, "—")}</small></strong>
        <small className="sd-exam-result__kpi-note">Marks earned</small>
      </article>
      <article className="sd-exam-result__kpi is-percentage">
        <div className="sd-exam-result__kpi-head"><span className="sd-exam-result__kpi-icon"><Percent size={19} /></span><span>Percentage</span></div>
        <strong>{value(score.percentage, "—")}%</strong>
        <div className="sd-exam-result__progress" role="progressbar" aria-label="Exam percentage" aria-valuenow={percentageValue} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${percentageValue}%` }} /></div>
      </article>
      <article className={`sd-exam-result__kpi ${passed === undefined ? "is-pending" : passed ? "is-passed" : "is-failed"}`}>
        <div className="sd-exam-result__kpi-head"><span className="sd-exam-result__kpi-icon"><CircleCheck size={19} /></span><span>Result</span></div>
        <strong>{passed === undefined ? "Submitted" : passed ? "Passed" : "Not passed"}</strong>
        <small className="sd-exam-result__kpi-note">{passed === undefined ? "Your attempt is complete" : passed ? "Well done on your result" : "Keep practicing and try again"}</small>
      </article>
      <article className="sd-exam-result__kpi is-answers">
        <div className="sd-exam-result__kpi-head"><span className="sd-exam-result__kpi-icon"><ClipboardList size={19} /></span><span>Answer summary</span></div>
        <div className="sd-exam-result__answer-counts">
          <span><b>{value(score.total_correct, "—")}</b><small>Correct</small></span>
          <span><b>{value(score.total_incorrect, "—")}</b><small>Incorrect</small></span>
          <span><b>{value(score.total_unattempted, "—")}</b><small>Skipped</small></span>
        </div>
      </article>
    </section>
    {sections.length > 0 && <section className="sd-exam-result__section"><h2>Section analysis</h2><div className="sd-exam-result__section-list">{sections.map((section, index) => {
      const attempted = getSectionAttemptCount(section, index, sections, review, overallAttempted);
      const totalQuestions = getSectionQuestionCount(section);
      const sectionQuestions = getSectionQuestions(section, review, sections, index);
      const correct = getSectionCorrectCount(section, sectionQuestions, asCount(score.total_correct), sections.length === 1);
      return <article className="sd-exam-result__section-row" key={section.section_id || index}>
        <strong className="sd-exam-result__section-name">{section.section_name || `Section ${index + 1}`}</strong>
        <span className="sd-exam-result__section-attempted"><b>{attempted ?? "—"}</b> attempted <small>/ {totalQuestions ?? "—"} questions</small></span>
        <span className="sd-exam-result__section-correct"><b>{correct ?? "—"}</b> correct</span>
        <b className="sd-exam-result__section-score">{section.score_obtained ?? section.marks_obtained ?? section.score ?? "—"} marks</b>
        <button className="sd-exam-result__section-view" type="button" onClick={() => setAnalysisSection(section)}>View questions</button>
      </article>;
    })}</div></section>}
    {analysisSection && <div className="sd-exam-result__modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setAnalysisSection(null); }}>
      <section className="sd-exam-result__modal" role="dialog" aria-modal="true" aria-labelledby="sd-exam-result-modal-title">
        <header className="sd-exam-result__modal-head">
          <div><span>SECTION ANALYSIS</span><h2 id="sd-exam-result-modal-title">{analysisSection.section_name || analysisSection.name || "Section questions"}</h2><p>Review your answer, the correct option, marks, and solution for each question.</p></div>
          <button type="button" aria-label="Close section analysis" onClick={() => setAnalysisSection(null)}><X size={20} /></button>
        </header>
        <div className="sd-exam-result__modal-content">
          {modalQuestions.length > 0
            ? modalQuestions.map((item, index) => {
              const answered = questionWasAnswered(item);
              const isCorrect = item.is_correct === true;
              const status = isCorrect ? "Correct" : item.is_correct === false && answered ? "Incorrect" : answered ? "Answered" : "Unanswered";
              return <article className="sd-exam-result__detail-question" key={item.question_id || index}>
                <header className="sd-exam-result__detail-head">
                  <span className="sd-exam-result__question-number">QUESTION {String(index + 1).padStart(2, "0")}</span>
                  <span className={`sd-exam-result__detail-status ${isCorrect ? "is-correct" : answered ? "is-incorrect" : "is-unanswered"}`}>{status}</span>
                </header>
                <h3>{item.question_text || item.question?.question_text || "Question"}</h3>
                <div className="sd-exam-result__answer-grid">
                  <div className={`sd-exam-result__answer-card ${isCorrect ? "is-correct" : "is-selected"}`}>
                    <span>Your answer</span><strong>{getAnswerLabel(item)}</strong>
                  </div>
                  <div className="sd-exam-result__answer-card is-correct">
                    <span>Correct answer</span><strong>{getAnswerLabel(item, true)}</strong>
                  </div>
                </div>
                <div className="sd-exam-result__detail-foot">
                  <span className="sd-exam-result__marks">Marks awarded <b>{item.marks_obtained ?? item.score_obtained ?? "—"}</b></span>
                </div>
                {(item.explanation || item.question?.explanation) && <div className="sd-exam-result__explanation"><strong>Solution</strong><p>{item.explanation || item.question?.explanation}</p></div>}
              </article>;
            })
            : <p className="sd-exam-result__modal-empty">Question level analysis is not available for this section.</p>}
        </div>
      </section>
    </div>}
    <p className="sd-exam-result__submitted"><CalendarCheck size={16} />{result?.submitted_at ? `Submitted ${new Date(result.submitted_at).toLocaleString()}` : "Your attempt has been submitted."}</p>
  </main>;
}
