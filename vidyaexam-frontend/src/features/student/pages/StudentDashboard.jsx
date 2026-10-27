import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock3,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  Target,
  Timer,
  TrendingUp,
} from "lucide-react";
import useAuthState from "../../auth/utils/useAuthState";
import { getStudentDashboard } from "../services/student-dashboard.service";
import DashboardWelcome from "../components/DashboardWelcome";
import BrandLoader from "../../../shared/components/ui/BrandLoader";
import "../styles/student-dashboard.css";

function formatDate(value, options = {}) {
  if (!value) return "Schedule to be announced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Schedule to be announced";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    ...options,
  }).format(date);
}

function formatDuration(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;
  return hours
    ? `${hours}h ${String(minutes).padStart(2, "0")}m`
    : `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`;
}

function OngoingExamCard({ exam }) {
  const [remaining, setRemaining] = useState(Number(exam?.remaining_seconds) || 0);

  useEffect(() => {
    setRemaining(Number(exam?.remaining_seconds) || 0);
  }, [exam?.attempt_id, exam?.remaining_seconds]);

  useEffect(() => {
    if (remaining <= 0) return undefined;
    const timer = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [remaining > 0]);

  if (!exam?.attempt_id || !exam?.exam_id) return null;

  return (
    <section className="sd-ongoing-card" aria-labelledby="sd-ongoing-title">
      <div className="sd-ongoing-card__icon"><Timer size={21} aria-hidden="true" /></div>
      <div className="sd-ongoing-card__copy">
        <span className="sd-section-kicker">IN PROGRESS</span>
        <h2 id="sd-ongoing-title">{exam.exam_title || "Your exam"}</h2>
        <p>Started {formatDate(exam.started_at, { timeStyle: "short" })} · {exam.duration_minutes ?? "—"} minutes</p>
      </div>
      <div className="sd-ongoing-card__timer" aria-live="polite">
        <span>Time remaining</span>
        <strong>{formatDuration(remaining)}</strong>
      </div>
      <Link
        className="sd-dashboard-primary-link"
        to={`/student/dashboard/exams/${encodeURIComponent(exam.exam_id)}/attempt/${encodeURIComponent(exam.attempt_id)}`}>
        Resume exam <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </section>
  );
}

function displayPlanValue(value) {
  if (!value) return "—";
  return String(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function DashboardKpis({ metrics, subscription }) {
  const items = [
    { label: "Current plan", value: displayPlanValue(subscription?.plan_name), note: "Your subscription", Icon: BadgeCheck, tone: "blue" },
    { label: "Plan status", value: displayPlanValue(subscription?.status), note: "Subscription status", Icon: ShieldCheck, tone: "green" },
    { label: "Tests completed", value: metrics?.tests_completed ?? 0, note: "Completed assessments", Icon: BookOpen, tone: "blue" },
    { label: "Tests passed", value: metrics?.tests_passed ?? 0, note: "Successful results", Icon: CircleCheck, tone: "green" },
    { label: "Tests failed", value: metrics?.tests_failed ?? 0, note: "Keep practicing", Icon: CircleX, tone: "amber" },
    { label: "Average score", value: `${Number(metrics?.overall_avg_percentage ?? 0).toFixed(1)}%`, note: "Across completed tests", Icon: TrendingUp, tone: "teal" },
    { label: "Success rate", value: `${Number(metrics?.success_rate_percentage ?? 0).toFixed(1)}%`, note: "Passed tests", Icon: Target, tone: "green" },
    { label: "Available exams", value: metrics?.available_exams_count ?? 0, note: "Ready for you", Icon: CalendarDays, tone: "violet" },
    { label: "Practice time", value: `${Math.round(Number(metrics?.total_practice_minutes ?? 0))} min`, note: `${metrics?.total_attempts_taken ?? 0} attempts taken`, Icon: Clock3, tone: "rose" },
  ];

  return (
    <section className="sd-dashboard-kpis" aria-label="Your performance">
      {items.map(({ label, value, note, Icon, tone }) => (
        <article className={`sd-dashboard-kpi is-${tone}`} key={label}>
          <span className="sd-dashboard-kpi__icon"><Icon size={19} aria-hidden="true" /></span>
          <span className="sd-dashboard-kpi__label">{label}</span>
          <strong className="sd-dashboard-kpi__value">{value}</strong>
          <span className="sd-dashboard-kpi__note">{note}</span>
        </article>
      ))}
    </section>
  );
}

function RecentTests({ tests }) {
  return (
    <section className="sd-card sd-dashboard-panel sd-dashboard-panel--recent" aria-labelledby="sd-recent-title">
      <div className="sd-dashboard-panel__heading">
        <span className="sd-dashboard-panel__heading-icon"><Award size={18} aria-hidden="true" /></span>
        <div><h2 id="sd-recent-title">Recent tests</h2><p>Your latest submitted results.</p></div>
        <Link to="/student/dashboard/exams" className="sd-dashboard-text-link">History <ArrowRight size={14} /></Link>
      </div>
      {tests.length ? (
        <div className="sd-recent-tests">
          {tests.slice(0, 4).map((test) => (
            <article className="sd-recent-test" key={test.attempt_id}>
              <span className={`sd-recent-test__status ${test.is_passed ? "is-pass" : "is-fail"}`}>
                {test.is_passed ? <CircleCheck size={17} /> : <CircleX size={17} />}
              </span>
              <div className="sd-recent-test__main">
                <strong>{test.exam_title || "Exam"}</strong>
                <span>{test.category_name || "Assessment"} · {formatDate(test.submitted_at)}</span>
              </div>
              <div className="sd-recent-test__score">
                <strong>{Number(test.score_obtained ?? 0).toFixed(2)}<small> / {Number(test.total_marks ?? 0).toFixed(2)}</small></strong>
                <span>{Number(test.percentage ?? 0).toFixed(1)}%</span>
              </div>
              {test.attempt_id && (
                <Link
                  to={`/student/dashboard/exams/result/${encodeURIComponent(test.attempt_id)}`}
                  className="sd-recent-test__result"
                  aria-label={`View result for ${test.exam_title || "exam"}`}>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="sd-dashboard-empty"><Award size={20} /><span>Your submitted test results will appear here.</span></div>
      )}
    </section>
  );
}

function AvailableTests({ tests }) {
  return (
    <section className="sd-card sd-dashboard-panel sd-dashboard-panel--available" aria-labelledby="sd-available-title">
      <div className="sd-dashboard-panel__heading">
        <span className="sd-dashboard-panel__heading-icon is-teal"><GraduationCap size={18} aria-hidden="true" /></span>
        <div><h2 id="sd-available-title">Available tests</h2><p>Exams assigned to your batches.</p></div>
        <Link to="/student/dashboard/exams" className="sd-dashboard-text-link">My Test <ArrowRight size={14} /></Link>
      </div>
      {tests.length ? (
        <div className="sd-available-tests">
          {tests.slice(0, 3).map((test) => (
            <article className="sd-available-test" key={test.exam_id}>
              <span className="sd-available-test__icon"><BookOpen size={17} aria-hidden="true" /></span>
              <div className="sd-available-test__main">
                <strong>{test.title || "Untitled exam"}</strong>
                <span>{test.category_name || "Exam"}</span>
              </div>
              <div className="sd-available-test__meta">
                <span><Clock3 size={13} />{test.duration_minutes ?? "—"} min</span>
                <span><Target size={13} />{Number(test.total_marks ?? 0).toFixed(0)} marks</span>
              </div>
              <time>
                {formatDate(test.starts_at, { timeStyle: "short" })}
                {test.ends_at ? ` – ${formatDate(test.ends_at, { timeStyle: "short" })}` : ""}
              </time>
            </article>
          ))}
        </div>
      ) : (
        <div className="sd-dashboard-empty"><CalendarDays size={20} /><span>No new tests are available right now.</span></div>
      )}
    </section>
  );
}

function StudentDashboardCharts({ charts }) {
  const scores = Array.isArray(charts?.score_progress) ? charts.score_progress : [];
  const accuracy = Array.isArray(charts?.question_accuracy) ? charts.question_accuracy : [];
  const accuracyTotal = accuracy.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  let cumulative = 0;
  const accuracyGradient = accuracy.map((item) => {
    const start = accuracyTotal ? (cumulative / accuracyTotal) * 100 : 0;
    cumulative += Number(item.value) || 0;
    const end = accuracyTotal ? (cumulative / accuracyTotal) * 100 : 0;
    return `${item.color || "#0f766e"} ${start}% ${end}%`;
  }).join(", ");
  return (
    <section className="sd-dashboard-charts" aria-label="Your exam performance charts">
      <article className="sd-dashboard-chart sd-dashboard-chart--scores">
        <header><span className="sd-dashboard-chart__eyebrow">SCORE PROGRESS</span><h2>Score by exam</h2><p>Compare your percentage across recent exams.</p></header>
        {scores.length ? <div className="sd-score-progress-chart" role="group" aria-label="Exam score percentages">
          <div className="sd-score-progress-chart__scale" aria-hidden="true">{[0, 25, 50, 75, 100].map((tick) => <span key={tick}>{tick}%</span>)}</div>
          <div className="sd-score-progress-chart__rows">
            {scores.map((item, index) => {
              const score = Math.max(0, Math.min(100, Number(item.score_percentage) || 0));
              const scoreObtained = Number(item.score_obtained) || 0;
              const totalMarks = Number(item.total_marks) || 0;
              const result = item.is_passed ? "Passed" : "Not passed";
              return <article className={`sd-score-progress-row ${item.is_passed ? "is-pass" : "is-fail"}`} key={`${item.exam_title}-${index}`} tabIndex="0" aria-label={`${item.exam_title}: ${score.toFixed(1)} percent, ${scoreObtained} of ${totalMarks} marks, ${result}`} title={`${item.exam_title} · ${score.toFixed(1)}% · ${scoreObtained}/${totalMarks} marks · ${result}`}>
                <div className="sd-score-progress-row__heading"><strong>{item.exam_title || "Exam"}</strong><span>{score.toFixed(1)}%</span></div>
                <div className="sd-score-progress-row__track" role="img" aria-label={`${score.toFixed(1)} percent`}><span style={{ width: `${score}%` }} /></div>
                <div className="sd-score-progress-row__meta"><span>{item.date_label || "Recent exam"} · {scoreObtained}/{totalMarks} marks</span><span className="sd-score-progress-row__result">{result}</span></div>
              </article>;
            })}
          </div>
        </div> : <p className="sd-dashboard-chart__empty">Your score progress will appear after you complete exams.</p>}
      </article>

      <article className="sd-dashboard-chart sd-dashboard-chart--accuracy">
        <header><span className="sd-dashboard-chart__eyebrow">QUESTION ACCURACY</span><h2>Answer accuracy</h2><p>See how your answers are distributed.</p></header>
        {accuracy.length && accuracyTotal ? <div className="sd-accuracy-chart">
          <div className="sd-accuracy-chart__donut" style={{ background: `conic-gradient(${accuracyGradient})` }} role="img" tabIndex="0" aria-label={`${accuracyTotal.toLocaleString()} questions answered: ${accuracy.map((item) => `${item.label} ${item.value}`).join(", ")}`} title={accuracy.map((item) => `${item.label}: ${Number(item.value).toLocaleString()}`).join(" · ")}>
            <span><strong>{accuracyTotal.toLocaleString()}</strong><small>questions</small></span>
          </div>
          <ul className="sd-accuracy-chart__legend">
            {accuracy.map((item, index) => <li key={`${item.label}-${index}`} tabIndex="0" title={`${item.label}: ${Number(item.value).toLocaleString()} (${((Number(item.value) / accuracyTotal) * 100).toFixed(1)}%)`}>
              <i style={{ backgroundColor: item.color || "#0f766e" }} /><span>{item.label}</span><strong>{Number(item.value).toLocaleString()}<small>{((Number(item.value) / accuracyTotal) * 100).toFixed(1)}%</small></strong>
            </li>)}
          </ul>
        </div> : <p className="sd-dashboard-chart__empty">Question accuracy will appear after you complete exams.</p>}
      </article>
    </section>
  );
}

export default function StudentDashboard() {
  const { user, subscription } = useAuthState();
  const [dashboard, setDashboard] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setError("");
    getStudentDashboard({ signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setDashboard(data);
        setStatus("ready");
      })
      .catch((requestError) => {
        if (controller.signal.aborted || requestError?.code === "ERR_CANCELED") return;
        setError(requestError?.response?.data?.message || requestError?.message || "Student dashboard could not be loaded.");
        setStatus("error");
      });
    return () => controller.abort();
  }, [refreshKey]);

  const profile = dashboard?.student_profile || {};
  const performance = dashboard?.performance_metrics || {};
  const recentTests = Array.isArray(dashboard?.recent_tests) ? dashboard.recent_tests : [];
  const availableTests = Array.isArray(dashboard?.available_tests) ? dashboard.available_tests : [];
  const charts = dashboard?.charts || {};
  const enrolledBatches = Array.isArray(profile.enrolled_batches) ? profile.enrolled_batches : [];

  return (
    <div className="sd-page">
      <main className="sd">
        <DashboardWelcome name={profile.full_name || user?.name} />
        {status === "error" && (
          <div className="sd-dashboard-load-error" role="alert">
            <CircleAlert size={19} aria-hidden="true" />
            <span>{error}</span>
            <button type="button" onClick={() => setRefreshKey((value) => value + 1)}>
              <RefreshCw size={14} aria-hidden="true" /> Retry
            </button>
          </div>
        )}
        {status === "loading" && !dashboard ? (
          <BrandLoader variant="content" message="Loading your dashboard…" />
        ) : dashboard ? (
          <>
            <section className="sd-student-context" aria-label="Student profile">
              <span className="sd-student-context__icon"><GraduationCap size={20} aria-hidden="true" /></span>
              <div className="sd-student-context__identity">
                <strong>{profile.full_name || user?.name || "Student"}</strong>
                <span>{profile.institute_name || "Your learning dashboard"}{profile.email ? ` · ${profile.email}` : ""}</span>
              </div>
              <div className="sd-student-context__batches">
                <span>Enrolled batches</span>
                {enrolledBatches.length ? enrolledBatches.map((batch) => (
                  <span className="sd-student-batch" key={batch.batch_id || batch.batch_name}>{batch.batch_name}</span>
                )) : <span className="sd-student-batch is-empty">No batch assigned</span>}
              </div>
            </section>
            <DashboardKpis metrics={performance} subscription={subscription} />
            <OngoingExamCard exam={dashboard.ongoing_exam} />
            <StudentDashboardCharts charts={charts} />
            <div className="sd-dashboard-content-grid">
              <RecentTests tests={recentTests} />
              <AvailableTests tests={availableTests} />
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
