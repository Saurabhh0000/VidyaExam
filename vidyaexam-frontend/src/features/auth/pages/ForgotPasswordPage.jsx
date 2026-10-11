import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MailCheck } from "lucide-react";
import AuthShell from "../components/AuthShell";
import SubmitButton from "../components/SubmitButton";
import { requestPasswordReset, AuthError } from "../services/auth.service";
import { isValidEmail } from "../utils/validation";
import { notify } from "../utils/notify";
import { validation } from "../utils/validation";

// Toast messages for this page
const MESSAGES = {
  emailRequired: "Please enter your email address.",
  emailInvalid: "Please enter a valid email address.",
  resetSent: "If an account exists for that email, a reset link is on its way.",
  resetUnavailable:
    "Password reset isn't available yet. Please contact support.",
  validation: "Check your email address and try again.",
  rate_limited: "Too many attempts. Wait a few minutes, then try again.",
  network: "Unable to connect. Check your connection and try again.",
  server: "Something went wrong. Please try again later.",
  unexpected: "Something went wrong. Please try again later.",
};

export default function ForgotPasswordPage() {
  const emailRef = useRef(null);
  const inFlight = useRef(false);
  const { invalid, validate, clear } = validation();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (inFlight.current) return;

    const message = !email.trim()
      ? MESSAGES.emailRequired
      : !isValidEmail(email)
        ? MESSAGES.emailInvalid
        : "";
    if (!validate([{ field: "email", ref: emailRef, message }])) {
      notify.error(message);
      return;
    }

    inFlight.current = true;
    setSubmitting(true);
    try {
      await requestPasswordReset({ email });
      setSent(true); // only after the service confirms
      notify.success(MESSAGES.resetSent);
    } catch (err) {
      const kind = err instanceof AuthError ? err.kind : "unexpected";
      notify.error(
        kind === "unavailable"
          ? MESSAGES.resetUnavailable
          : (MESSAGES[kind] ?? MESSAGES.unexpected),
      );
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      {sent ? (
        <div role="status">
          <span className="ve-auth__done-icon" aria-hidden="true">
            <MailCheck size={26} />
          </span>
          <h1 className="ve-auth__title">Check your email</h1>
          <p className="ve-auth__sub">{MESSAGES.resetSent}</p>
          <Link to="/login" className="ve-btn ve-btn--secondary">
            Back to login
          </Link>
        </div>
      ) : (
        <>
          <div className="ve-auth__intro">
            <h1 className="ve-auth__title">Reset your password</h1>
            <p className="ve-auth__sub">
              Enter the email linked to your account and we'll help you reset
              your password.
            </p>
          </div>

          <form className="ve-form" onSubmit={handleSubmit} noValidate>
            <div className="ve-field">
              <label htmlFor="forgot-email">Email</label>
              <input
                ref={emailRef}
                id="forgot-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="name@example.com"
                value={email}
                disabled={submitting}
                aria-invalid={Boolean(invalid.email)}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clear("email");
                }}
              />
            </div>

            <SubmitButton
              busy={submitting}
              label="Send reset link"
              busyLabel="Sending link"
            />
          </form>

          <p className="ve-auth__switch">
            <Link to="/login" className="ve-back">
              <ArrowLeft size={16} aria-hidden="true" />
              Back to login
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
