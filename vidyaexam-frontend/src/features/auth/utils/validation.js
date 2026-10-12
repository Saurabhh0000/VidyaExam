
import { useState } from "react";
import { notify } from "./notify";

export function isValidEmail(value) {
  const email = String(value ?? "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validation() {
  const [invalid, setInvalid] = useState({});

  function validate(fields = []) {
    const errors = {};

    fields.forEach(({ field, message }) => {
      if (message) {
        errors[field] = message;
      }
    });

    setInvalid(errors);

    const firstInvalid = fields.find(({ message }) =>
      Boolean(message)
    );

    if (firstInvalid) {
      notify.error(firstInvalid.message);
      firstInvalid.ref?.current?.focus?.();
      return false;
    }

    return true;
  }

  function clear(field) {
    if (!field) {
      setInvalid({});
      return;
    }

    setInvalid((previous) => {
      if (!previous[field]) return previous;

      const updated = { ...previous };
      delete updated[field];
      return updated;
    });
  }

  return {
    invalid,
    validate,
    clear,
  };
}
