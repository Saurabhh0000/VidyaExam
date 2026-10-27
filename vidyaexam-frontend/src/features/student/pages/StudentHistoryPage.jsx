import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Award, CalendarDays, CircleAlert, CircleCheck, CircleX, RefreshCw } from "lucide-react";
import PageHeader from "../../../shared/components/ui/PageHeader";
import BrandLoader from "../../../shared/components/ui/BrandLoader";
import { getExamErrorMessage, getMyExamHistory } from "../../exams/services/exams.service";
import "../styles/my-exams.css";

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function StudentHistoryPage() {
  const [attempts, setAttempts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setError("");
    getMyExamHistory()
      .then((data) => {
        if (!active) return;
        setAttempts(data);
        setStatus("ready");
      })
      .catch((requestError) => {
        if (!active) return;
        setError(getExamErrorMessage(requestError, requestError.message || "Your test history could not be loaded."));
        setStatus("error");
      });
    return () => { active = false; };
  }, [refreshKey]);

  return (
    <main className="sd-my-exams sd-test-history">
      <PageHeader
        eyebrow="YOUR LEARNING"
        title="Test History"
        description="Review your submitted exams, scores, and results."
        icon={CalendarDays}
        actions={(
          <button type="button" className="sd-my-exams__refresh" onClick={refresh} disabled={status === "loading"}>
            <RefreshCw size={16} aria-hidden="true" /> Refresh
          </button>
        )}
      />

      {status === "loading" ? (
        <BrandLoader variant="content" message="Loading your test history…" />
      ) : status === "error" ? (
        <section className="sd-my-exams__state is-error" role="alert">
          <CircleAlert size={24} aria-hidden="true" />
          <h2>Could not load test history</h2>
          <p>{error}</p>
          <button type="button" className="sd-my-exams__refresh" onClick={refresh}>Try again</button>
        </section>
      ) : attempts.length === 0 ? (
        <section className="sd-my-exams__state">
          <Award size={26} aria-hidden="true" />
          <h2>No submitted tests yet</h2>
          <p>Your completed exam attempts and scores will appear here.</p>
          <Link className="sd-my-exams__start" to="/student/dashboard/exams">Browse My Test</Link>
        </section>
      ) : (
        <section className="sd-test-history__list" aria-label="Submitted tests">
          {attempts.map((attempt) => (
            <article className="sd-test-history__card" key={attempt.attempt_id}>
              <span className={`sd-test-history__result-icon ${attempt.is_passed ? "is-pass" : "is-fail"}`}>
                {attempt.is_passed ? <CircleCheck size={20} aria-hidden="true" /> : <CircleX size={20} aria-hidden="true" />}
              </span>
              <div className="sd-test-history__exam">
                <span>{attempt.category_name || "Assessment"}</span>
                <h2>{attempt.exam_title || "Exam attempt"}</h2>
                <time dateTime={attempt.submitted_at}>{formatDate(attempt.submitted_at)}</time>
              </div>
              <div className="sd-test-history__score">
                <strong>{Number(attempt.score_obtained ?? 0).toFixed(2)} <small>/ {Number(attempt.total_marks ?? 0).toFixed(2)}</small></strong>
                <span className={attempt.is_passed ? "is-pass" : "is-fail"}>
                  {attempt.is_passed ? "Passed" : "Not passed"} · {Number(attempt.percentage ?? 0).toFixed(1)}%
                </span>
              </div>
              <Link
                className="sd-test-history__view"
                to={`/student/dashboard/exams/result/${encodeURIComponent(attempt.attempt_id)}`}>
                View result <Award size={15} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
