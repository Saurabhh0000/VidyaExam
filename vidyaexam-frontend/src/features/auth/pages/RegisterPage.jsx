import { Link, useSearchParams } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import AccountTypeSelector from "../components/AccountTypeSelector";
import RegisterForm from "../components/RegisterForm";
import OrganizationRegisterForm from "../components/OrganizationRegisterForm";
import "../register.css";

const COPY = {
  individual: {
    title: "Create your VidyaExam account",
    sub: "Start preparing for your next milestone with a more focused learning experience.",
  },
  organization: {
    title: "Register your organization",
    sub: "Set up your institution and its first administrator.",
  },
};

export default function RegisterPage() {
  const [params, setParams] = useSearchParams();
  const type =
    params.get("type") === "organization" ? "organization" : "individual";

  const changeType = (next) =>
    setParams(next === "organization" ? { type: next } : {}, { replace: true });

  const isOrg = type === "organization";

  return (
    <AuthShell wide={isOrg}>
      <div className="ve-reg">
        <div className="ve-auth__intro">
          <h1 className="ve-auth__title">{COPY[type].title}</h1>
          <p className="ve-auth__sub">{COPY[type].sub}</p>
        </div>

        <AccountTypeSelector value={type} onChange={changeType} />

        {/* Both forms stay mounted so switching never discards typed values. */}
        <div hidden={isOrg}>
          <RegisterForm />
        </div>
        <div hidden={!isOrg}>
          <OrganizationRegisterForm />
        </div>

        <p className="ve-auth__switch">
          Already have an account?{" "}
          <Link to="/login" className="ve-link">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
