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
import { STUDENT_DASHBOARD } from "./roleRoutes";
import OrganizationDashboard from "../features/organization-admin/pages/OrganizationDashboard";

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
          path="/organization/dashboard/:view?"
          element={
            <RequireRole role="ADMIN">
              <MainLayout>
                <OrganizationDashboard />
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
