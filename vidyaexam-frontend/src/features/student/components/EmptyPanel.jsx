/**
 * INTEGRATION BOUNDARY. No endpoints for these sections exist yet, so they
 * show honest empty states. Replace the body when the API is available.
 */
export default function EmptyPanel({ id, Icon, title, heading, text }) {
  return (
    <section className="sd-card" aria-labelledby={id}>
      <h2 id={id} className="sd-card__title">
        <Icon size={18} aria-hidden="true" /> {title}
      </h2>
      <div className="sd-empty">
        <span className="sd-empty__icon" aria-hidden="true">
          <Icon size={22} />
        </span>
        <p className="sd-empty__heading">{heading}</p>
        <p className="sd-muted">{text}</p>
      </div>
    </section>
  );
}
