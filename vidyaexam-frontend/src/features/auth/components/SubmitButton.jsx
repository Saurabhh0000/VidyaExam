/** Primary button: same width/height while loading, so nothing shifts. */
export default function SubmitButton({ busy, label, busyLabel }) {
  return (
    <button
      type="submit"
      className="ve-btn ve-btn--primary"
      disabled={busy}
      aria-busy={busy}>
      {busy ? (
        <span>{busyLabel}…</span>
      ) : (
        label
      )}
    </button>
  );
}
