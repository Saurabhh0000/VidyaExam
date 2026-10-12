import { Link, NavLink, useInRouterContext } from "react-router-dom";

const isInternal = (to) =>
  typeof to === "string" && to.startsWith("/") && !to.startsWith("//");

/**
 * Router-aware link. Internal paths use React Router (client-side navigation,
 * and NavLink's active state when `nav` is set). Anything else, or a Header
 * rendered outside a Router, falls back to a plain anchor.
 */
export default function AppLink({
  to,
  nav = false,
  end = false,
  className = "",
  activeClassName = "is-active",
  children,
  ...rest
}) {
  const inRouter = useInRouterContext();

  if (!inRouter || !isInternal(to)) {
    return (
      <a href={to} className={className} {...rest}>
        {children}
      </a>
    );
  }

  if (nav) {
    return (
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          isActive ? `${className} ${activeClassName}` : className
        }
        {...rest}>
        {children}
      </NavLink>
    );
  }

  return (
    <Link to={to} className={className} {...rest}>
      {children}
    </Link>
  );
}
