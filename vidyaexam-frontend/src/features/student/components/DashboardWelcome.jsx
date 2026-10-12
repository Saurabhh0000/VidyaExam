function greeting(date = new Date()) {
  const h = date.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function DashboardWelcome({ name }) {
  const first = typeof name === "string" ? name.trim().split(/\s+/)[0] : "";
  return (
    <header className="sd-welcome">
      <h1 className="sd-welcome__title">
        {greeting()}
        {first ? `, ${first}` : ""}!
      </h1>
      <p className="sd-welcome__sub">
        Ready to make progress toward your next exam?
      </p>
    </header>
  );
}
