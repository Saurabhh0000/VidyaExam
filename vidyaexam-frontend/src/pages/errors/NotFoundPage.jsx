import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Compass, House } from "lucide-react";
import ErrorShell from "./ErrorShell";
import useErrorPage from "./useErrorPage";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const headingRef = useErrorPage("Page not found | VidyaExam");

  // "default" means this page was the first entry in the session, so there is
  // nowhere useful to go back to; the Back button is simply not offered then.
  const canGoBack = location.key !== "default";

  return (
    <ErrorShell>
      <section className="ve-err__card" aria-labelledby="notfound-title">
        {/* Decorative numerals; the real status is in the eyebrow + heading */}
        <div className="ve-err__code" aria-hidden="true">
          <span>4</span>
          <span className="ve-err__orb">
            <Compass strokeWidth={1.75} />
          </span>
          <span>4</span>
        </div>

        <p className="ve-err__eyebrow">Error 404</p>
        <h1
          id="notfound-title"
          className="ve-err__title"
          tabIndex={-1}
          ref={headingRef}>
          Oops! Page not found
        </h1>
        <p className="ve-err__text">
          The page you're looking for doesn't exist or may have moved. Check the
          address, or head back to somewhere familiar.
        </p>

        <div className="ve-err__actions">
          <Link to="/" className="ve-err__btn ve-err__btn--primary">
            <House size={18} aria-hidden="true" />
            Go to Home
          </Link>
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
      </section>
    </ErrorShell>
  );
}
