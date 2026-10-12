import { AuthError } from "../services/auth.service";
import { notify } from "./notify";

/**
 * Mobile rule. ASSUMPTION (unconfirmed with backend): exactly 10 digits, as in
 * the sample payloads. The value is validated as typed — nothing is stripped or
 * reformatted, so leading zeros are preserved. Change here if the backend differs.
 */
export const MOBILE_PATTERN = /^\d{10}$/;
export const isValidMobile = (value) => MOBILE_PATTERN.test(value.trim());

/**
 * ASSUMPTION (carried over from the existing form): minimum 8 characters.
 * No other password policy is enforced client-side.
 */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Only COACHING_INSTITUTE is confirmed by the sample payload. Add further
 * { value, label } entries here once the backend enum is confirmed.
 */
export const TENANT_TYPES = [
  { value: "COACHING_INSTITUTE", label: "Coaching Institute / Academy (Govt Exams, IT/CSE, Test Prep)" },
  { value: "EDUCATIONAL_INSTITUTE", label: "Educational Institute (College, University, School)" },
  { value: "CORPORATE", label: "Corporate / Company (Hiring & Technical Assessments)" },
  { value: "SCHOOL", label: "School" },
  { value: "COLLEGE", label: "College" },
  { value: "OTHER", label: "Other" } 
];

/** Advisory strength estimate only; it is not a backend rule. */
export function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "" };
  const points = [
    password.length >= 8,
    password.length >= 12,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const score = points <= 1 ? 1 : points === 2 ? 2 : points === 3 ? 3 : 4;
  return { score, label: ["", "Weak", "Fair", "Good", "Strong"][score] };
}

export const REGISTER_MESSAGES = {
  nameRequired: "Please enter your full name.",
  emailRequired: "Please enter your email address.",
  emailInvalid: "Please enter a valid email address.",
  mobileInvalid: "Please enter a valid 10-digit mobile number.",
  passwordRequired: "Please enter a password.",
  passwordShort: `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`,
  confirmRequired: "Please confirm your password.",
  passwordMismatch: "The passwords don't match. Please re-enter them.",
  registered: "Account created. Sign in to continue.",
  orgRegistered: "Organization registered. Sign in to continue.",
  unavailable: "Registration isn't available right now. Please contact support.",
  conflict: "An account with these details already exists.",
  validation: "Check your details and try again.",
  forbidden: "You don't have permission to complete this registration.",
  rate_limited: "Too many attempts. Wait a few minutes, then try again.",
  network: "Unable to connect. Check your connection and try again.",
  timeout: "The request took too long. Please try again.",
  server: "Something went wrong. Please try again later.",
  unexpected: "Something went wrong. Please try again later.",
};

/** Maps a service failure to one concise toast. Never includes server detail. */
export function notifyRegistrationError(err) {
  const kind = err instanceof AuthError ? err.kind : "unexpected";
  notify.error(REGISTER_MESSAGES[kind] ?? REGISTER_MESSAGES.unexpected);
}