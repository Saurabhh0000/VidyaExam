import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import Home from "../pages/Home";
import LoginPage from "../features/auth/pages/LoginPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import NotFoundPage from "../pages/errors/NotFoundPage";
import UnauthorizedPage from "../pages/errors/UnauthorizedPage";

import RequireRole from "./RequireRole";
import StudentDashboard from "../features/student/pages/StudentDashboard";
import MyExamsPage from "../features/student/pages/MyExamsPage";
import { STUDENT_DASHBOARD, SUPER_ADMIN_DASHBOARD, TEACHER_DASHBOARD } from "./roleRoutes";
import OrganizationDashboard from "../features/organization-admin/pages/OrganizationDashboard";
import SuperAdminDashboard from "../features/super-admin/pages/SuperAdminDashboard";
import UserSettings from "../features/account/pages/UserSettings";
import TeacherDashboard from "../features/teacher/pages/TeacherDashboard";
import BrandLoader from "../shared/components/ui/BrandLoader";
const QuestionBankPage = lazy(() => import("../features/question-bank/pages/QuestionBankPage"));
const ExamsPage = lazy(() => import("../features/exams/pages/ExamsPage"));
const ExamSectionsPage = lazy(() => import("../features/exams/pages/ExamsPage").then((module) => ({ default: module.ExamSectionsPage })));
const StudentExamAttemptPage = lazy(() => import("../features/student/pages/StudentExamAttemptPage"));
const StudentExamResultPage = lazy(() => import("../features/student/pages/StudentExamResultPage"));

function QuestionBankRoute({ initialCreate = false }) {
  return <Suspense fallback={<BrandLoader variant="content" message="Loading Question Bank…" />}><QuestionBankPage initialCreate={initialCreate} /></Suspense>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <MainLayout>
              <Home />
            </MainLayout>
          }
        />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route
          path={STUDENT_DASHBOARD}
          element={
            <RequireRole role="STUDENT">
              <MainLayout>
                <StudentDashboard />
              </MainLayout>
            </RequireRole>
          }
        />
        <Route
          path={`${STUDENT_DASHBOARD}/exams`}
          element={
            <RequireRole role="STUDENT">
              <MainLayout>
                <MyExamsPage />
              </MainLayout>
            </RequireRole>
          }
        />
        <Route
          path={`${STUDENT_DASHBOARD}/exams/:examId/attempt/:attemptId`}
          element={<RequireRole role="STUDENT"><MainLayout><Suspense fallback={<BrandLoader variant="content" message="Preparing your exam…" />}><StudentExamAttemptPage /></Suspense></MainLayout></RequireRole>}
        />
        <Route
          path={`${STUDENT_DASHBOARD}/exams/result/:attemptId`}
          element={<RequireRole role="STUDENT"><MainLayout><Suspense fallback={<BrandLoader variant="content" message="Loading your result…" />}><StudentExamResultPage /></Suspense></MainLayout></RequireRole>}
        />
        <Route
          path={`${STUDENT_DASHBOARD}/settings`}
          element={
            <RequireRole role="STUDENT">
              <MainLayout>
                <UserSettings />
              </MainLayout>
            </RequireRole>
          }
        />
        <Route
          path={`${TEACHER_DASHBOARD}/settings`}
          element={<RequireRole role="TEACHER"><MainLayout><UserSettings /></MainLayout></RequireRole>}
        />
        <Route
          path={`${TEACHER_DASHBOARD}/questions/create`}
          element={<RequireRole role="TEACHER"><MainLayout><QuestionBankRoute initialCreate /></MainLayout></RequireRole>}
        />
        <Route
          path={`${TEACHER_DASHBOARD}/questions`}
          element={<RequireRole role="TEACHER"><MainLayout><QuestionBankRoute /></MainLayout></RequireRole>}
        />
        <Route
          path={`${TEACHER_DASHBOARD}/exams`}
          element={<RequireRole role="TEACHER"><MainLayout><Suspense fallback={<BrandLoader variant="content" message="Loading exams…" />}><ExamsPage /></Suspense></MainLayout></RequireRole>}
        />
        <Route
          path={`${TEACHER_DASHBOARD}/exams/sections`}
          element={<RequireRole role="TEACHER"><MainLayout><Suspense fallback={<BrandLoader variant="content" message="Loading exam sections…" />}><ExamSectionsPage /></Suspense></MainLayout></RequireRole>}
        />
        <Route
          path={TEACHER_DASHBOARD}
          element={<RequireRole role="TEACHER"><MainLayout><TeacherDashboard /></MainLayout></RequireRole>}
        />
        <Route
          path="/organization/dashboard/questions"
          element={<RequireRole role="ADMIN"><MainLayout><QuestionBankRoute /></MainLayout></RequireRole>}
        />
        <Route
          path="/organization/dashboard/questions/create"
          element={<RequireRole role="ADMIN"><MainLayout><QuestionBankRoute initialCreate /></MainLayout></RequireRole>}
        />
        <Route
          path="/organization/dashboard/:view?/:tab?"
          element={
            <RequireRole role="ADMIN">
              <MainLayout>
                <OrganizationDashboard />
              </MainLayout>
            </RequireRole>
          }
        />
        <Route
          path={`${SUPER_ADMIN_DASHBOARD}/:section?/:tab?`}
          element={
            <RequireRole role="SUPER_ADMIN">
              <MainLayout>
                <SuperAdminDashboard />
              </MainLayout>
            </RequireRole>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Routes>
    </BrowserRouter>
  );
}
