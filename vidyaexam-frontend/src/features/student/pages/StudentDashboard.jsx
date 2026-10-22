import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, CalendarDays, CircleAlert, Clock3, History, RefreshCw, TrendingUp } from "lucide-react";
import useAuthState from "../../auth/utils/useAuthState";
import { getExamErrorMessage, getMyExams } from "../../exams/services/exams.service";
import DashboardWelcome from "../components/DashboardWelcome";
import DashboardHeroSlider from "../components/DashboardHeroSlider";
import PlanOverview from "../components/PlanOverview";
import PlanFeatures from "../components/PlanFeatures";
import EmptyPanel from "../components/EmptyPanel";
import "../styles/student-dashboard.css";

function AvailableExamsPanel() {
  const [exams, setExams] = useState([]);
  const [studentBatchesCount, setStudentBatchesCount] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

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

  return <section className="sd-card sd-exam-summary" aria-labelledby="sd-exams-title">
    <div className="sd-exam-summary__heading">
      <h2 id="sd-exams-title" className="sd-card__title"><BookOpen size={18} aria-hidden="true" />Available exams</h2>
      {status === "ready" && exams.length > 0 && <span className="sd-exam-summary__count">{exams.length} available</span>}
    </div>
    {status === "loading" ? <p className="sd-exam-summary__message">Loading your exams…</p>
      : status === "error" ? <div className="sd-exam-summary__empty is-error"><CircleAlert size={20} /><p>{error}</p><button type="button" onClick={() => setRefreshKey((value) => value + 1)}><RefreshCw size={14} />Try again</button></div>
        : exams.length > 0 ? <div className="sd-exam-summary__list">{exams.slice(0, 3).map((exam) => <article key={exam.exam_id}>
          <span className="sd-exam-summary__icon"><CalendarDays size={17} aria-hidden="true" /></span>
          <div><strong>{exam.title || "Untitled exam"}</strong><p>{exam.category_name || "Exam"} · <Clock3 size={13} aria-hidden="true" /> {exam.duration_minutes ?? "—"} min · {exam.total_marks ?? "—"} marks</p></div>
        </article>)}</div>
          : <div className="sd-exam-summary__empty"><CalendarDays size={22} /><p>{studentBatchesCount === 0 ? "Your account is not assigned to a batch yet. Ask your organization admin to check your enrollment." : "Published exams assigned to your batch will appear here."}</p></div>}
    <Link className="sd-exam-summary__link" to="/student/dashboard/exams">Open My Test <ArrowRight size={15} aria-hidden="true" /></Link>
  </section>;
}

export default function StudentDashboard() {
  const { user, subscription } = useAuthState();
  const historyIncluded = subscription?.features?.performance_history;

  return (
    <div className="sd-page">
      <main className="sd">
        <DashboardWelcome name={user?.name} />
        <DashboardHeroSlider subscription={subscription} />
        <PlanOverview subscription={subscription} />

        <div className="sd-grid">
          <EmptyPanel
            id="sd-continue"
            Icon={History}
            title="Continue learning"
            heading="Nothing to resume yet"
            text="When you start a test, you'll be able to pick up where you left off here."
          />
          <EmptyPanel
            id="sd-progress"
            Icon={TrendingUp}
            title="Your progress"
            heading="No results yet"
            text={
              historyIncluded === false
                ? "Performance history isn't included in your current plan."
                : "Your scores and progress will appear here after you complete a mock test."
            }
          />
          <AvailableExamsPanel />
          <PlanFeatures subscription={subscription} />
        </div>
      </main>
    </div>
  );
}
