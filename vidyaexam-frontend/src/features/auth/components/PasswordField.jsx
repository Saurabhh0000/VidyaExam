import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  onBlur,
  inputRef,
  invalid,
  disabled,
  autoComplete,
  placeholder,
  labelAside,
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="ve-field">
      <div className="ve-field__row">
        <label htmlFor={id}>{label}</label>
        {labelAside}
      </div>
      <div className="ve-input-wrap">
        <input
          ref={inputRef}
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          aria-invalid={Boolean(invalid)}
          onChange={onChange}
          onBlur={onBlur}
        />
        <button
          type="button"
          className="ve-input-wrap__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          disabled={disabled}>
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
