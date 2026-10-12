import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  House,
  LayoutDashboard,
  LockKeyhole,
  LogIn,
} from "lucide-react";
import ErrorShell from "./ErrorShell";
import useErrorPage from "./useErrorPage";
import useAuthState from "../../features/auth/utils/useAuthState";

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const headingRef = useErrorPage("Access denied | VidyaExam");
  const { isAuthenticated, dashboardPath } = useAuthState();

  const canGoBack = location.key !== "default";
  // Forwarded so login can return the user afterwards. Never displayed here.
  const from = location.state?.from;

  return (
    <ErrorShell>
      <section className="ve-err__card" aria-labelledby="denied-title">
        <div className="ve-err__shield" aria-hidden="true">
          <span className="ve-err__ring ve-err__ring--outer" />
          <span className="ve-err__ring ve-err__ring--inner" />
          <span className="ve-err__core">
            <LockKeyhole strokeWidth={1.75} />
          </span>
        </div>

        <p className="ve-err__eyebrow">Error 403</p>
        <h1
          id="denied-title"
          className="ve-err__title"
          tabIndex={-1}
          ref={headingRef}>
          Access denied
        </h1>

        {isAuthenticated ? (
          <>
            <p className="ve-err__text">
              Your account doesn't have permission to view this page. If you
              think this is a mistake, please contact your administrator to
              request access.
            </p>
            <div className="ve-err__actions">
              {dashboardPath ? (
                <Link
                  to={dashboardPath}
                  className="ve-err__btn ve-err__btn--primary">
                  <LayoutDashboard size={18} aria-hidden="true" />
                  Go to My Dashboard
                </Link>
              ) : (
                <Link to="/" className="ve-err__btn ve-err__btn--primary">
                  <House size={18} aria-hidden="true" />
                  Go to Home
                </Link>
              )}
              {canGoBack && (
                <button
                  type="button"
                  className="ve-err__btn ve-err__btn--secondary"
                  onClick={() => navigate(-1)}>
                  <ArrowLeft size={18} aria-hidden="true" />
                  Go Back
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="ve-err__text">
              You need to sign in with an authorized account to view this page.
            </p>
            <div className="ve-err__actions">
              <Link
                to="/login"
                state={from ? { from } : undefined}
                className="ve-err__btn ve-err__btn--primary">
                <LogIn size={18} aria-hidden="true" />
                Sign In
              </Link>
              <Link to="/" className="ve-err__btn ve-err__btn--secondary">
                <House size={18} aria-hidden="true" />
                Go Home
              </Link>
            </div>
          </>
        )}
      </section>
    </ErrorShell>
  );
}
