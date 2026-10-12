import "./loader.css";

export default function Loader({
  variant = "inline",
  label = "Loading...",
  size = "md",
  showLogo = true,
}) {
  if (variant === "button") {
    return (
      <span
        className={`ve-loader-spinner ve-loader-spinner--${size}`}
        role="status"
        aria-label={label}
      />
    );
  }

  return (
    <div
      className={`ve-loader ve-loader--${variant}`}
      role="status"
      aria-live="polite">
      {showLogo && (
        <img
          className="ve-loader-image"
          src="/vidyaexam-loader.png"
          alt=""
          aria-hidden="true"
        />
      )}

      <span
        className={`ve-loader-spinner ve-loader-spinner--${size}`}
        aria-hidden="true"
      />

      {label && <p className="ve-loader-label">{label}</p>}
    </div>
  );
}
