import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../services/auth.service";
import { isValidEmail, validation } from "../utils/validation";
import { notify } from "../utils/notify";
import {
  MIN_PASSWORD_LENGTH,
  REGISTER_MESSAGES as M,
  isValidMobile,
  notifyRegistrationError,
} from "../utils/registration";
import FormField from "./FormField";
import PasswordField from "./PasswordField";
import PasswordStrength from "./PasswordStrength";
import SubmitButton from "./SubmitButton";

const INITIAL = {
  full_name: "",
  email: "",
  mobile_no: "",
  password: "",
  confirm: "",
};

/** Individual registration → POST /users/register */
export default function RegisterForm() {
  const navigate = useNavigate();
  const refs = {
    full_name: useRef(null),
    email: useRef(null),
    mobile_no: useRef(null),
    password: useRef(null),
    confirm: useRef(null),
  };
  const inFlight = useRef(false);
  const { validate, clear } = validation();

  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const bind = (field) => ({
    value: values[field],
    disabled: submitting,
    onChange: (e) => {
      const next = field === "mobile_no"
        ? e.target.value.replace(/\D/g, "").slice(0, 10)
        : e.target.value;
      const nextValues = { ...values, [field]: next };
      setValues(nextValues);
      setErrors((prev) => {
        const updated = { ...prev };
        if (touched[field] || prev[field]) updated[field] = findErrors(nextValues)[field];
        if (field === "password" && (touched.confirm || prev.confirm)) {
          updated.confirm = findErrors(nextValues).confirm;
        }
        return updated;
      });
      clear(field);
      if (field === "password") clear("confirm");
    },
    onBlur: () => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      setErrors((prev) => ({ ...prev, [field]: findErrors(values)[field] }));
    },
  });

  function findErrors(formValues = values) {
    const { full_name, email, mobile_no, password, confirm } = formValues;
    const name = full_name.trim();
    return {
      full_name: !name
        ? M.nameRequired
        : name.length < 2
          ? "Enter at least 2 characters for your name."
          : name.length > 150
            ? "Your name must be 150 characters or fewer."
            : "",
      email: !email.trim()
        ? M.emailRequired
        : email.trim().length > 255 || !isValidEmail(email.trim())
          ? M.emailInvalid
          : "",
      mobile_no: isValidMobile(mobile_no) ? "" : M.mobileInvalid,
      password: !password
        ? M.passwordRequired
        : password.length < MIN_PASSWORD_LENGTH
          ? M.passwordShort
          : new TextEncoder().encode(password).length > 72
            ? "Password must be 72 UTF-8 bytes or fewer."
          : "",
      confirm: !confirm
        ? M.confirmRequired
        : confirm !== password
          ? M.passwordMismatch
          : "",
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (inFlight.current) return;

    const found = findErrors();
    setErrors(found);
    // validate() focuses the first invalid field and raises the toast.
    const ok = validate(
      Object.keys(found).map((field) => ({
        field,
        ref: refs[field],
        message: found[field],
      })),
    );
    if (!ok) return;

    inFlight.current = true;
    setSubmitting(true);
    try {
      // `confirm` is frontend-only and is deliberately not passed on.
      await register({
        full_name: values.full_name,
        email: values.email,
        mobile_no: values.mobile_no,
        password: values.password,
      });
      // Reached only after the backend confirmed. No auto-login is assumed.
      notify.success(M.registered);
      navigate("/login", { replace: true });
    } catch (err) {
      notifyRegistrationError(err);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form className="ve-form" onSubmit={handleSubmit} noValidate>
      <FormField
        id="register-name"
        label="Full name"
        name="full_name"
        type="text"
        autoComplete="name"
        placeholder="Your full name"
        inputRef={refs.full_name}
        error={errors.full_name}
        {...bind("full_name")}
      />

      <FormField
        id="register-email"
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="name@example.com"
        inputRef={refs.email}
        error={errors.email}
        {...bind("email")}
      />

      <FormField
        id="register-mobile"
        label="Mobile number"
        name="mobile_no"
        type="tel"
        autoComplete="tel-national"
        inputMode="numeric"
        pattern="[0-9]{10}"
        maxLength={10}
        placeholder="10-digit mobile number"
        inputRef={refs.mobile_no}
        error={errors.mobile_no}
        {...bind("mobile_no")}
      />

      <div className="ve-field-stack">
        <PasswordField
          id="register-password"
          label="Password"
          autoComplete="new-password"
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          inputRef={refs.password}
          invalid={errors.password}
          {...bind("password")}
        />
        {errors.password ? (
          <p className="ve-field__error">{errors.password}</p>
        ) : (
          <PasswordStrength password={values.password} />
        )}
      </div>

      <div className="ve-field-stack">
        <PasswordField
          id="register-confirm"
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          inputRef={refs.confirm}
          invalid={errors.confirm}
          {...bind("confirm")}
        />
        {errors.confirm && <p className="ve-field__error">{errors.confirm}</p>}
      </div>

      <SubmitButton
        busy={submitting}
        label="Create individual account"
        busyLabel="Creating account..."
      />
    </form>
  );
}
