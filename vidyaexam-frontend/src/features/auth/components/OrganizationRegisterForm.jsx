import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerOrganization } from "../services/auth.service";
import { isValidEmail, validation } from "../utils/validation";
import { notify } from "../utils/notify";
import {
  MIN_PASSWORD_LENGTH,
  REGISTER_MESSAGES as M,
  TENANT_TYPES,
  isValidMobile,
  notifyRegistrationError,
} from "../utils/registration";
import FormField from "./FormField";
import PasswordField from "./PasswordField";
import PasswordStrength from "./PasswordStrength";
import SubmitButton from "./SubmitButton";

const ORG_MESSAGES = {
  tenant_name: "Please enter the organization name.",
  tenant_code: "Please enter an organization code.",
  tenant_type: "Please select an organization type.",
  tenant_email: "Please enter a valid organization email address.",
  tenant_mobile: "Please enter a valid 10-digit organization mobile number.",
  address: "Please enter the organization address.",
  admin_full_name: "Please enter the administrator's full name.",
  admin_email: "Please enter a valid administrator email address.",
  admin_mobile: "Please enter a valid 10-digit administrator mobile number.",
};

// Field order = DOM order, so the first invalid field receives focus.
const FIELDS = [
  "tenant_name",
  "tenant_code",
  "tenant_type",
  "tenant_email",
  "tenant_mobile",
  "address",
  "admin_full_name",
  "admin_email",
  "admin_mobile",
  "admin_password",
  "confirm",
];

const INITIAL = {
  tenant_name: "",
  tenant_code: "",
  tenant_type: TENANT_TYPES.length === 1 ? TENANT_TYPES[0].value : "",
  tenant_email: "",
  tenant_mobile: "",
  address: "",
  admin_full_name: "",
  admin_email: "",
  admin_mobile: "",
  admin_password: "",
  confirm: "",
};

/** Organization registration → POST /tenants/registerTenant */
export default function OrganizationRegisterForm() {
  const navigate = useNavigate();
  const refs = {
    tenant_name: useRef(null),
    tenant_code: useRef(null),
    tenant_type: useRef(null),
    tenant_email: useRef(null),
    tenant_mobile: useRef(null),
    address: useRef(null),
    admin_full_name: useRef(null),
    admin_email: useRef(null),
    admin_mobile: useRef(null),
    admin_password: useRef(null),
    confirm: useRef(null),
  };
  const inFlight = useRef(false);
  const { validate, clear } = validation();

  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const bind = (field) => ({
    value: values[field],
    disabled: submitting,
    onChange: (e) => {
      const next = e.target.value;
      setValues((v) => ({ ...v, [field]: next }));
      setErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));
      clear(field);
    },
  });

  const emailError = (value, message) =>
    value.trim() && isValidEmail(value.trim()) ? "" : message;

  function findErrors() {
    const v = values;
    const password = v.admin_password;
    return {
      tenant_name: v.tenant_name.trim() ? "" : ORG_MESSAGES.tenant_name,
      tenant_code: v.tenant_code.trim() ? "" : ORG_MESSAGES.tenant_code,
      tenant_type: TENANT_TYPES.some((t) => t.value === v.tenant_type)
        ? ""
        : ORG_MESSAGES.tenant_type,
      tenant_email: emailError(v.tenant_email, ORG_MESSAGES.tenant_email),
      tenant_mobile: isValidMobile(v.tenant_mobile)
        ? ""
        : ORG_MESSAGES.tenant_mobile,
      address: v.address.trim() ? "" : ORG_MESSAGES.address,
      admin_full_name: v.admin_full_name.trim()
        ? ""
        : ORG_MESSAGES.admin_full_name,
      admin_email: emailError(v.admin_email, ORG_MESSAGES.admin_email),
      admin_mobile: isValidMobile(v.admin_mobile)
        ? ""
        : ORG_MESSAGES.admin_mobile,
      admin_password: !password
        ? M.passwordRequired
        : password.length < MIN_PASSWORD_LENGTH
          ? M.passwordShort
          : "",
      confirm: !v.confirm
        ? M.confirmRequired
        : v.confirm !== password
          ? M.passwordMismatch
          : "",
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (inFlight.current) return;

    const found = findErrors();
    setErrors(found);
    const ok = validate(
      FIELDS.map((field) => ({
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
      await registerOrganization({
        tenant_name: values.tenant_name,
        tenant_code: values.tenant_code,
        tenant_type: values.tenant_type,
        tenant_email: values.tenant_email,
        tenant_mobile: values.tenant_mobile,
        address: values.address,
        admin_full_name: values.admin_full_name,
        admin_email: values.admin_email,
        admin_mobile: values.admin_mobile,
        admin_password: values.admin_password,
      });
      notify.success(M.orgRegistered);
      navigate("/login", { replace: true });
    } catch (err) {
      notifyRegistrationError(err);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form className="ve-form ve-form--org" onSubmit={handleSubmit} noValidate>
      <section className="ve-section" aria-labelledby="org-details-title">
        <h2 id="org-details-title" className="ve-section__title">
          <span className="ve-section__step" aria-hidden="true">
            1
          </span>
          Organization details
        </h2>
        <div className="ve-grid">
          <FormField
            id="org-name"
            label="Organization name"
            name="tenant_name"
            type="text"
            autoComplete="organization"
            placeholder="ABC Coaching Institute"
            inputRef={refs.tenant_name}
            error={errors.tenant_name}
            {...bind("tenant_name")}
          />
          <FormField
            id="org-code"
            label="Organization code"
            name="tenant_code"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            placeholder="ABC001"
            inputRef={refs.tenant_code}
            error={errors.tenant_code}
            {...bind("tenant_code")}
          />
          <FormField
            id="org-type"
            as="select"
            label="Organization type"
            name="tenant_type"
            inputRef={refs.tenant_type}
            error={errors.tenant_type}
            {...bind("tenant_type")}>
            {TENANT_TYPES.length > 1 && (
              <option value="" disabled>
                Select a type
              </option>
            )}
            {TENANT_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </FormField>
          <FormField
            id="org-email"
            label="Organization email"
            name="tenant_email"
            type="email"
            autoComplete="off"
            inputMode="email"
            placeholder="contact@example.com"
            inputRef={refs.tenant_email}
            error={errors.tenant_email}
            {...bind("tenant_email")}
          />
          <FormField
            id="org-mobile"
            label="Organization mobile number"
            name="tenant_mobile"
            type="tel"
            autoComplete="off"
            inputMode="numeric"
            placeholder="10-digit mobile number"
            inputRef={refs.tenant_mobile}
            error={errors.tenant_mobile}
            {...bind("tenant_mobile")}
          />
          <div className="ve-grid__full">
            <FormField
              id="org-address"
              as="textarea"
              rows={2}
              label="Address"
              name="address"
              autoComplete="street-address"
              placeholder="City, State"
              inputRef={refs.address}
              error={errors.address}
              {...bind("address")}
            />
          </div>
        </div>
      </section>

      <section className="ve-section" aria-labelledby="org-admin-title">
        <h2 id="org-admin-title" className="ve-section__title">
          <span className="ve-section__step" aria-hidden="true">
            2
          </span>
          Administrator details
        </h2>
        <div className="ve-grid">
          <FormField
            id="admin-name"
            label="Administrator full name"
            name="admin_full_name"
            type="text"
            autoComplete="name"
            placeholder="Full name"
            inputRef={refs.admin_full_name}
            error={errors.admin_full_name}
            {...bind("admin_full_name")}
          />
          <FormField
            id="admin-email"
            label="Administrator email"
            name="admin_email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="name@example.com"
            inputRef={refs.admin_email}
            error={errors.admin_email}
            {...bind("admin_email")}
          />
          <FormField
            id="admin-mobile"
            label="Administrator mobile number"
            name="admin_mobile"
            type="tel"
            autoComplete="tel-national"
            inputMode="numeric"
            placeholder="10-digit mobile number"
            inputRef={refs.admin_mobile}
            error={errors.admin_mobile}
            {...bind("admin_mobile")}
          />
          <div className="ve-field-stack">
            <PasswordField
              id="admin-password"
              label="Administrator password"
              autoComplete="new-password"
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              inputRef={refs.admin_password}
              invalid={errors.admin_password}
              {...bind("admin_password")}
            />
            {errors.admin_password ? (
              <p className="ve-field__error">{errors.admin_password}</p>
            ) : (
              <PasswordStrength password={values.admin_password} />
            )}
          </div>
          <div className="ve-field-stack">
            <PasswordField
              id="admin-confirm"
              label="Confirm password"
              autoComplete="new-password"
              placeholder="Re-enter the password"
              inputRef={refs.confirm}
              invalid={errors.confirm}
              {...bind("confirm")}
            />
            {errors.confirm && (
              <p className="ve-field__error">{errors.confirm}</p>
            )}
          </div>
        </div>
      </section>

      <section className="ve-section ve-section--submit">
        <SubmitButton
          busy={submitting}
          label="Register organization"
          busyLabel="Registering organization..."
        />
      </section>
    </form>
  );
}
