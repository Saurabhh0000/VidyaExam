import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "../../shared/components/Header";
import Footer from "../../shared/components/Footer";
import DashboardBreadcrumb from "../../shared/components/DashboardBreadcrumb";

export default function MainLayout({ children }) {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <div className="app-shell">
      <Header />
      <DashboardBreadcrumb />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
