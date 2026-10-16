import "./brand-loader.css";

/** Shared animated VidyaExam wordmark for page, content, and section loading. */
export default function BrandLoader({ variant = "section", message = "", className = "" }) {
  const loadingLabel = message ? `Loading VidyaExam. ${message}` : "Loading VidyaExam";

  return (
    <div
      className={`ve-brand-loader ve-brand-loader--${variant}${className ? ` ${className}` : ""}`}
      role="status"
      aria-live="polite"
      aria-label={loadingLabel}
      aria-busy="true"
    >
      <div className="ve-brand-loader__identity" aria-hidden="true">
        <div className="ve-brand-loader__wordmark">
          <span className="ve-brand-loader__vidya">Vidya</span><span className="ve-brand-loader__exam">Exam</span>
        </div>
        <span className="ve-brand-loader__underline" />
        <span className="ve-brand-loader__tagline">Empowering learning, achieving dreams.</span>
      </div>
      {message && <span className="ve-brand-loader__message" aria-hidden="true">{message}</span>}
    </div>
  );
}
