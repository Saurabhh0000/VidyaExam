import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login, AuthError } from "../services/auth.service";
import { isValidEmail } from "../utils/validation";
import { notify } from "../utils/notify";
import { validation } from "../utils/validation";
import PasswordField from "./PasswordField";
import SubmitButton from "./SubmitButton";
import { getSnapshot } from "../state/sessionStore";
import { dashboardPathFor } from "../../../app/roleRoutes";

// Toast messages for this form
const MESSAGES = {
  emailRequired: "Please enter your email address.",
  emailInvalid: "Please enter a valid email address.",
  passwordRequired: "Please enter your password.",
  success: "Login successful. Welcome back!",
  invalid_credentials: "Invalid email or password. Please try again.",
  validation: "Check your email and password, then try again.",
  forbidden:
    "This account can't sign in right now. Contact support if this continues.",
  rate_limited: "Too many attempts. Wait a few minutes, then try again.",
  network: "Unable to connect. Check your connection and try again.",
  server: "Something went wrong. Please try again later.",
  unexpected: "Something went wrong. Please try again later.",
};

export default function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const inFlight = useRef(false);
  const { invalid, validate, clear } = validation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (inFlight.current) return;

    const emailMessage = !email.trim()
      ? MESSAGES.emailRequired
      : !isValidEmail(email)
        ? MESSAGES.emailInvalid
        : "";

    // Email is checked first, then password. Stops before any API call.
    const ok = validate([
      { field: "email", ref: emailRef, message: emailMessage },
      {
        field: "password",
        ref: passwordRef,
        message: password ? "" : MESSAGES.passwordRequired,
      },
    ]);
    if (!ok) {
      const firstInvalidMessage = emailMessage
        ? emailMessage
        : MESSAGES.passwordRequired;

      notify.error(firstInvalidMessage);
      return;
    }

    inFlight.current = true;
    setSubmitting(true);
    try {
      await login({ email, password });
      notify.success(MESSAGES.success);
      const from = location.state?.from?.pathname;
      const roleHome = dashboardPathFor(getSnapshot().user?.role);
      const canReturnToRequestedPath =
        !roleHome || from === roleHome || from?.startsWith(`${roleHome}/`);
      const destination = canReturnToRequestedPath
        ? from || roleHome || "/"
        : roleHome || "/";

      navigate(destination, { replace: true });
    } catch (err) {
      const kind = err instanceof AuthError ? err.kind : "unexpected";
      notify.error(MESSAGES[kind] ?? MESSAGES.unexpected);
      if (kind === "invalid_credentials") {
        setPassword("");
        passwordRef.current?.focus();
      }
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="ve-auth__intro">
        <h1 className="ve-auth__title">Welcome back</h1>
        <p className="ve-auth__sub">
          Sign in to access your learning dashboard.
        </p>
      </div>

      <form className="ve-form" onSubmit={handleSubmit} noValidate>
        <div className="ve-field">
          <label htmlFor="login-email">Email</label>
          <input
            ref={emailRef}
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
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

        <PasswordField
          id="login-password"
          label="Password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          inputRef={passwordRef}
          invalid={invalid.password}
          disabled={submitting}
          onChange={(e) => {
            setPassword(e.target.value);
            clear("password");
          }}
          labelAside={
            <Link to="/forgot-password" className="ve-link">
              Forgot password?
            </Link>
          }
        />

        <SubmitButton
          busy={submitting}
          label="Sign in"
          busyLabel="Signing in"
        />
      </form>

      <p className="ve-auth__switch">
        New to VidyaExam?{" "}
        <Link to="/register" className="ve-link">
          Create an account
        </Link>
      </p>
    </>
  );
}
