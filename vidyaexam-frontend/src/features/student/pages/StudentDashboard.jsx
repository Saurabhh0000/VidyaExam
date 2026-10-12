import { BookOpen, History, TrendingUp } from "lucide-react";
import useAuthState from "../../auth/utils/useAuthState";
import DashboardWelcome from "../components/DashboardWelcome";
import DashboardHeroSlider from "../components/DashboardHeroSlider";
import PlanOverview from "../components/PlanOverview";
import PlanFeatures from "../components/PlanFeatures";
import EmptyPanel from "../components/EmptyPanel";
import "../styles/student-dashboard.css";

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
          <EmptyPanel
            id="sd-exams"
            Icon={BookOpen}
            title="Available exams"
            heading="No exams to show yet"
            text="Available exams and mock tests will appear here once they're published."
          />
          <PlanFeatures subscription={subscription} />
        </div>
      </main>
    </div>
  );
}
