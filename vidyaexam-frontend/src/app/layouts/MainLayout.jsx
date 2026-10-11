import Header from "../../shared/components/Header";
import Footer from "../../shared/components/Footer";

export default function MainLayout({ children }) {
  return (
    <div className="app-shell">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
