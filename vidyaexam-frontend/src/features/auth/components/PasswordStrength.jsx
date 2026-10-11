import { getPasswordStrength } from "../utils/registration";

/** Advisory strength meter. Text label carries the meaning, not colour alone. */
export default function PasswordStrength({ password }) {
  const { score, label } = getPasswordStrength(password);
  if (!score) return null;

  return (
    <div className="ve-strength" data-score={score}>
      <div className="ve-strength__bars" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} data-on={n <= score} />
        ))}
      </div>
      <span className="ve-strength__label" role="status">
        Strength: {label}
      </span>
    </div>
  );
}
