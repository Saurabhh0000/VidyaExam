import { useId } from "react";

/**
 * Labelled control (input / select / textarea) with hint + inline error text,
 * wired through aria-invalid and aria-describedby.
 */
export default function FormField({
  id,
  label,
  error,
  hint,
  inputRef,
  as: Control = "input",
  children,
  ...controlProps
}) {
  const uid = useId();
  const hintId = hint ? `${uid}-hint` : undefined;
  const errorId = error ? `${uid}-error` : undefined;
  const describedBy =
    [errorId ?? hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="ve-field">
      <label htmlFor={id}>{label}</label>
      <Control
        id={id}
        ref={inputRef}
        aria-required="true"
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...controlProps}>
        {children}
      </Control>
      {error ? (
        <p id={errorId} className="ve-field__error">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="ve-field__hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
