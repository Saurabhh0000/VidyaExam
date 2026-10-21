import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import "./PageHeader.css";

export default function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  breadcrumbs,
  actions,
  meta,
  className = "",
}) {
  const metaItems = Array.isArray(meta) ? meta : meta ? [meta] : [];

  return (
    <header className={`ve-page-header${className ? ` ${className}` : ""}`}>
      <span className="ve-page-header__art" aria-hidden="true">
        <svg viewBox="0 0 1600 360" preserveAspectRatio="none" focusable="false">
          <defs>
            <linearGradient id="ve-header-wave-a" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#b8f3df" stopOpacity=".12" />
              <stop offset=".56" stopColor="#4dd1c2" stopOpacity=".27" />
              <stop offset="1" stopColor="#36b9df" stopOpacity=".13" />
            </linearGradient>
            <linearGradient id="ve-header-wave-b" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#87ebc5" stopOpacity=".15" />
              <stop offset=".55" stopColor="#35c5b8" stopOpacity=".23" />
              <stop offset="1" stopColor="#58c9ed" stopOpacity=".1" />
            </linearGradient>
            <linearGradient id="ve-header-wave-c" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#51d7c0" stopOpacity=".08" />
              <stop offset="1" stopColor="#27aeca" stopOpacity=".19" />
            </linearGradient>
          </defs>
          <path d="M760 360C930 330 968 244 1112 203c153-44 215 32 342-33 62-32 109-74 146-120v310H760Z" fill="url(#ve-header-wave-a)" />
          <path d="M850 360c133-59 199-162 345-170 122-7 152 78 279 37 57-18 96-52 126-84v217H850Z" fill="url(#ve-header-wave-b)" />
          <path d="M1038 360c121-44 190-129 306-128 91 1 127 48 206 29 21-5 39-14 50-23v122h-562Z" fill="url(#ve-header-wave-c)" />
          <path d="M812 359c177-42 234-152 390-181 136-25 198 47 325-10 43-19 76-47 108-83" fill="none" stroke="#fff" strokeOpacity=".73" strokeWidth="2" />
          <path d="M927 359c126-55 190-138 328-152 119-12 158 55 278 20 44-13 75-34 102-58" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="2" />
          <circle cx="1404" cy="78" r="21" fill="#73ded1" fillOpacity=".4" />
          <circle cx="1512" cy="132" r="10" fill="#57dac3" fillOpacity=".45" />
        </svg>
      </span>
      {Array.isArray(breadcrumbs) && breadcrumbs.length > 0 && (
        <nav className="ve-page-header__breadcrumbs" aria-label="Breadcrumb">
          <ol>
            {breadcrumbs.map((crumb, index) => {
              const current = index === breadcrumbs.length - 1;
              return (
                <li key={`${crumb.label}-${index}`}>
                  {index > 0 && <ChevronRight size={14} aria-hidden="true" />}
                  {crumb.to && !current ? <Link to={crumb.to}>{crumb.label}</Link> : <span aria-current={current ? "page" : undefined}>{crumb.label}</span>}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
      <div className="ve-page-header__layout">
        <div className="ve-page-header__content">
          {Icon && <span className="ve-page-header__icon"><Icon size={23} aria-hidden="true" /></span>}
          <div className="ve-page-header__copy">
            {eyebrow && <p className="ve-page-header__eyebrow">{eyebrow}</p>}
            <h1>{title}</h1>
            {description && <div className="ve-page-header__description">{description}</div>}
            {metaItems.length > 0 && <div className="ve-page-header__meta">{metaItems.map((item, index) => <span className="ve-page-header__meta-item" key={index}>{item}</span>)}</div>}
          </div>
        </div>
        {actions && <div className="ve-page-header__actions">{actions}</div>}
      </div>
    </header>
  );
}
