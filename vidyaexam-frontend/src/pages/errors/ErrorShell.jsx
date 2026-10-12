import { Link } from "react-router-dom";
import LogoImage from "../../features/auth/components/LogoImage";
import "./errors.css";

/** Standalone shell: works whether or not the app header is rendered. */
export default function ErrorShell({ children }) {
  return (
    <div className="ve-err">
      <header className="ve-err__bar">
        <Link to="/" className="ve-err__home">
          <LogoImage className="ve-err__logo" />
        </Link>
      </header>
      <main className="ve-err__main">{children}</main>
    </div>
  );
}
