import PageHeader from "../../../shared/components/ui/PageHeader";
import { GraduationCap } from "lucide-react";

function greeting(date = new Date()) {
  const h = date.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function DashboardWelcome({ name }) {
  const first = typeof name === "string" ? name.trim().split(/\s+/)[0] : "";
  const title = `${greeting()}${first ? `, ${first}` : ""}!`;
  return (
    <PageHeader
      className="sd-page-header"
      icon={GraduationCap}
      title={title}
      description="Ready to make progress toward your next exam?"
    />
  );
}
