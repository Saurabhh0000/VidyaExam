import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  ORGANIZATION_DASHBOARD,
  STUDENT_DASHBOARD,
  SUPER_ADMIN_DASHBOARD,
  TEACHER_DASHBOARD,
} from "../../app/roleRoutes";
import "../../styles/dashboard-heading.css";

const roleRoots = {
  student: { path: STUDENT_DASHBOARD, label: "Student Dashboard" },
  teacher: { path: TEACHER_DASHBOARD, label: "Teacher Dashboard" },
  organization: { path: ORGANIZATION_DASHBOARD, label: "Organization Dashboard" },
  "super-admin": { path: SUPER_ADMIN_DASHBOARD, label: "Super Admin Dashboard" },
};

const labels = {
  settings: "Settings",
  employee: "Employees",
  teacher: "Teachers",
  student: "Students",
  questions: "Question Bank",
  create: "Create Question",
  taxonomy: "Taxonomy & Curriculum",
  subjects: "Subjects",
  topics: "Topics",
  categories: "Exam Categories",
  master: "Master",
  batches: "Batches",
  exams: "Exams",
  sections: "Sections",
  organizations: "Organizations / Tenants",
  users: "Users",
  subscriptions: "Subscriptions & Plans",
  analytics: "Reports & Analytics",
  overview: "Overview",
};

function getCrumbs(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  const role = roleRoots[parts[0]];
  if (!role) return null;

  const crumbs = [{ label: "Dashboard", to: role.path }];
  const section = parts[2];
  const tab = parts[3];

  if (parts[0] === "student") {
    if (section) crumbs.push({ label: labels[section] || section });
    return crumbs;
  }

  if (parts[0] === "teacher") {
    if (section === "questions") {
      crumbs.push({ label: labels.questions, to: `${role.path}/questions` });
      if (tab) crumbs.push({ label: labels[tab] || tab });
    } else if (section) crumbs.push({ label: labels[section] || section });
    return crumbs;
  }

  if (parts[0] === "organization") {
    if (!section) return crumbs;
    if (section === "taxonomy") {
      crumbs.push({ label: labels.taxonomy, to: `${role.path}/taxonomy` });
      if (tab) crumbs.push({ label: labels[tab] || tab });
    } else if (section === "master") {
      crumbs.push({ label: labels.master, to: `${role.path}/master` });
      if (tab) crumbs.push({ label: labels[tab] || tab });
    } else if (section === "questions") {
      crumbs.push({ label: labels.questions, to: `${role.path}/questions` });
      if (tab) crumbs.push({ label: labels[tab] || tab });
    } else {
      crumbs.push({ label: labels[section] || section });
    }
    return crumbs;
  }

  if (parts[0] === "super-admin") {
    if (!section) return crumbs;
    if (section === "master") {
      crumbs.push({ label: labels.master, to: `${role.path}/master` });
      if (tab && tab !== "batches") crumbs.push({ label: labels[tab] || tab });
      else if (tab === "batches") crumbs.push({ label: "Batches" });
    } else if (section === "taxonomy") {
      crumbs.push({ label: labels.taxonomy, to: `${role.path}/taxonomy` });
      if (tab) crumbs.push({ label: labels[tab] || tab });
    } else if (section === "questions") {
      crumbs.push({ label: labels.questions, to: `${role.path}/questions` });
      if (tab) crumbs.push({ label: labels[tab] || tab });
    } else {
      crumbs.push({ label: labels[section] || section });
    }
  }
  return crumbs;
}

export default function DashboardBreadcrumb() {
  const { pathname } = useLocation();
  const crumbs = getCrumbs(pathname);
  if (!crumbs) return null;

  return (
    <nav className="dashboard-breadcrumb" aria-label="Breadcrumb">
      <ol>
        <li className="dashboard-breadcrumb-home">
          <Link to={crumbs[0].to} aria-label="Dashboard home">
            <Home size={14} aria-hidden="true" />
            <span>Dashboard</span>
          </Link>
        </li>
        {crumbs.slice(1).map((crumb, index) => (
          <li key={`${crumb.label}-${index}`}>
            <ChevronRight size={14} aria-hidden="true" />
            {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
