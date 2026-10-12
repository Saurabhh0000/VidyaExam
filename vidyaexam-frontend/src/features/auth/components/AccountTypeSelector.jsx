import { Building2, Check, UserRound } from "lucide-react";

const OPTIONS = [
  {
    value: "individual",
    Icon: UserRound,
    title: "Individual",
    text: "Prepare smarter. Track your progress.",
  },
  {
    value: "organization",
    Icon: Building2,
    title: "Organization",
    text: "Manage your institution's examination needs.",
  },
];

/**
 * Selectable cards built on native radio inputs: arrow keys, Tab focus and
 * screen-reader semantics come from the browser.
 */
export default function AccountTypeSelector({ value, onChange, disabled }) {
  return (
    <fieldset className="ve-acct" disabled={disabled}>
      <legend className="ve-acct__legend">Account type</legend>
      <div className="ve-acct__options">
        {OPTIONS.map(({ value: optionValue, Icon, title, text }) => (
          <label key={optionValue} className="ve-acct__option">
            <input
              type="radio"
              name="account-type"
              value={optionValue}
              checked={value === optionValue}
              onChange={() => onChange(optionValue)}
            />
            <span className="ve-acct__card">
              <span className="ve-acct__head">
                <span className="ve-acct__icon" aria-hidden="true">
                  <Icon size={16} strokeWidth={2} />
                </span>
                <span className="ve-acct__title">{title}</span>
                <span className="ve-acct__check" aria-hidden="true">
                  <Check size={12} strokeWidth={3} />
                </span>
              </span>
              <span className="ve-acct__text">{text}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
