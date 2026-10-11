
import toast from "../../../shared/components/ui/toast";

const DEDUPE_MS = 2000;
const recent = new Map();

export const MESSAGES = {
  emailRequired: "Please enter your email address.",
  emailInvalid: "Please enter a valid email address.",
  passwordRequired: "Please enter your password.",
  success: "Login successful. Welcome back!",
  invalid_credentials: "Invalid email or password. Please try again.",
  validation: "Please check your details and try again.",
  forbidden: "This account can't sign in right now. Contact support.",
  rate_limited: "Too many attempts. Wait a few minutes, then try again.",
  network: "Unable to connect. Check your connection and try again.",
  server: "Something went wrong. Please try again later.",
  unexpected: "Something went wrong. Please try again later.",
  resetSent: "If an account exists for that email, a reset link is on its way.",
  resetUnavailable: "Password reset isn't available yet. Please contact support.",
};

function send(kind, message) {
  const key = `${kind}:${message}`;
  const now = Date.now();

  if (now - (recent.get(key) ?? 0) < DEDUPE_MS) return;

  recent.set(key, now);

  const handler = toast[kind];

  if (typeof handler !== "function") {
    console.error(`Notification handler "${kind}" is unavailable.`);
    return;
  }

  handler(message);
}

export const notify = {
  success: (message) => send("success", message),
  error: (message) => send("error", message),
  warning: (message) => send("warning", message),
  info: (message) => send("info", message),
};
