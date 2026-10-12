
import { toast as sonnerToast } from "sonner";

const DEFAULT_DURATION = 4000;

export const toast = {
  success(message, options = {}) {
    return sonnerToast.success(message, {
      duration: DEFAULT_DURATION,
      ...options,
    });
  },

  error(message, options = {}) {
    return sonnerToast.error(message, {
      duration: 5000,
      ...options,
    });
  },

  warning(message, options = {}) {
    return sonnerToast.warning(message, {
      duration: 4500,
      ...options,
    });
  },

  info(message, options = {}) {
    return sonnerToast.info(message, {
      duration: DEFAULT_DURATION,
      ...options,
    });
  },

  loading(message, options = {}) {
    return sonnerToast.loading(message, {
      duration: Infinity,
      ...options,
    });
  },

  message(message, options = {}) {
    return sonnerToast(message, {
      duration: DEFAULT_DURATION,
      ...options,
    });
  },

  promise(promise, messages, options = {}) {
    return sonnerToast.promise(promise, {
      loading: messages.loading || "Please wait...",
      success: messages.success || "Operation completed successfully.",
      error: messages.error || "Something went wrong. Please try again.",
      ...options,
    });
  },

  dismiss(id) {
    return sonnerToast.dismiss(id);
  },

  dismissAll() {
    return sonnerToast.dismiss();
  },
};

export default toast;
