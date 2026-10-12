import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import "./modal.css";

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  closeOnOverlay = true,
  showCloseButton = true,
  footer,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="ve-modal-overlay"
      onMouseDown={(event) => {
        if (closeOnOverlay && event.target === event.currentTarget) {
          onClose?.();
        }
      }}>
      <section
        className={`ve-modal ve-modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ve-modal-title"
        aria-describedby={description ? "ve-modal-description" : undefined}>
        <header className="ve-modal-header">
          <div className="ve-modal-heading">
            {title && (
              <h2 id="ve-modal-title" className="ve-modal-title">
                {title}
              </h2>
            )}

            {description && (
              <p id="ve-modal-description" className="ve-modal-description">
                {description}
              </p>
            )}
          </div>

          {showCloseButton && (
            <button
              type="button"
              className="ve-modal-close"
              onClick={onClose}
              aria-label="Close dialog">
              <X size={20} />
            </button>
          )}
        </header>

        <div className="ve-modal-content">{children}</div>

        {footer && <footer className="ve-modal-footer">{footer}</footer>}
      </section>
    </div>,
    document.body,
  );
}
