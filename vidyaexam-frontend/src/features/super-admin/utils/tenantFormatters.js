import toast from "../../../shared/components/ui/toast";

/**
 * Format raw enum-style tenant type into human-friendly string.
 * e.g. "COACHING_INSTITUTE" -> "Coaching Institute"
 */
export function formatTenantType(type) {
  if (!type) return "Organization";
  return String(type)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Format ISO dates nicely.
 */
export function formatDate(dateVal, includeTime = false) {
  if (!dateVal) return "—";
  const date = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

/**
 * Format billing intervals.
 */
export function formatInterval(interval) {
  if (!interval) return "Free";
  const norm = String(interval).toUpperCase();
  if (norm === "FREE") return "Free";
  if (norm === "MONTHLY") return "Monthly";
  if (norm === "YEARLY" || norm === "ANNUAL") return "Yearly";
  return String(interval).replaceAll("_", " ").toLowerCase();
}

/**
 * Copy string to clipboard with user feedback toast.
 */
export async function copyToClipboard(text, label = "Item") {
  if (!text) return;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      toast.success(`${label} copied to clipboard`);
    }
  } catch {
    toast.error("Unable to copy to clipboard");
  }
}
