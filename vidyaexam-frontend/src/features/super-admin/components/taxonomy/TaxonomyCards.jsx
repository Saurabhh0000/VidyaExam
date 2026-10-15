import { FolderGit2, BookOpen, Layers, Calendar } from "lucide-react";
import { formatDate } from "../../utils/tenantFormatters";

export function CategoryCards({ categories }) {
  if (!categories || categories.length === 0) {
    return (
      <div className="sa-table-empty">
        <FolderGit2 size={32} className="sa-empty-icon" aria-hidden="true" />
        <p>No categories found</p>
      </div>
    );
  }

  return (
    <div className="sa-taxonomy-cards-grid">
      {categories.map((cat) => (
        <article key={cat.category_id} className="sa-tax-card">
          <div className="sa-tax-card-header">
            <div className="sa-taxonomy-icon is-cat">
              <FolderGit2 size={18} aria-hidden="true" />
            </div>
            <div className="sa-tax-card-titles">
              <h3>{cat.category_name}</h3>
              <span className="sa-code-badge">{cat.category_code}</span>
            </div>
            <span
              className={`sa-status-pill ${
                cat.is_active ? "is-active" : "is-inactive"
              }`}
            >
              <span className="sa-status-dot" />
              {cat.is_active ? "Active" : "Inactive"}
            </span>
          </div>

          <p className="sa-tax-card-desc">
            {cat.description || <em>No description provided</em>}
          </p>

          <div className="sa-tax-card-footer">
            <span className="sa-tax-meta-item">
              <Calendar size={13} aria-hidden="true" />
              {formatDate(cat.created_at)}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}

export function SubjectCards({ subjects }) {
  if (!subjects || subjects.length === 0) {
    return (
      <div className="sa-table-empty">
        <BookOpen size={32} className="sa-empty-icon" aria-hidden="true" />
        <p>No subjects found</p>
      </div>
    );
  }

  return (
    <div className="sa-taxonomy-cards-grid">
      {subjects.map((subj) => (
        <article key={subj.subject_id} className="sa-tax-card">
          <div className="sa-tax-card-header">
            <div className="sa-taxonomy-icon is-subj">
              <BookOpen size={18} aria-hidden="true" />
            </div>
            <div className="sa-tax-card-titles">
              <h3>{subj.subject_name}</h3>
              {subj.subject_code && (
                <span className="sa-code-badge">{subj.subject_code}</span>
              )}
            </div>
            <span
              className={`sa-status-pill ${
                subj.is_active ? "is-active" : "is-inactive"
              }`}
            >
              <span className="sa-status-dot" />
              {subj.is_active ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="sa-tax-card-parent">
            <span className="sa-parent-label">Category:</span>
            <div className="sa-parent-tag">
              <FolderGit2 size={13} aria-hidden="true" />
              <span>{subj.category_name || "—"}</span>
              {subj.category_code && (
                <span className="sa-code-badge is-subtle">{subj.category_code}</span>
              )}
            </div>
          </div>

          <div className="sa-tax-card-footer">
            <span className="sa-tax-meta-item">
              <Calendar size={13} aria-hidden="true" />
              {formatDate(subj.created_at)}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}

export function TopicCards({ topics }) {
  if (!topics || topics.length === 0) {
    return (
      <div className="sa-table-empty">
        <Layers size={32} className="sa-empty-icon" aria-hidden="true" />
        <p>No topics found</p>
      </div>
    );
  }

  return (
    <div className="sa-taxonomy-cards-grid">
      {topics.map((top) => (
        <article key={top.topic_id} className="sa-tax-card">
          <div className="sa-tax-card-header">
            <div className="sa-taxonomy-icon is-topic">
              <Layers size={18} aria-hidden="true" />
            </div>
            <div className="sa-tax-card-titles">
              <h3>{top.topic_name}</h3>
            </div>
            <span
              className={`sa-status-pill ${
                top.is_active ? "is-active" : "is-inactive"
              }`}
            >
              <span className="sa-status-dot" />
              {top.is_active ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="sa-tax-card-parent">
            <span className="sa-parent-label">Subject:</span>
            <div className="sa-parent-tag">
              <BookOpen size={13} aria-hidden="true" />
              <span>{top.subject_name || "—"}</span>
              {top.subject_code && (
                <span className="sa-code-badge is-subtle">{top.subject_code}</span>
              )}
            </div>
          </div>

          {top.category_name && (
            <div className="sa-tax-card-parent" style={{ marginTop: "4px" }}>
              <span className="sa-parent-label">Category:</span>
              <div className="sa-parent-tag">
                <FolderGit2 size={13} aria-hidden="true" />
                <span>{top.category_name}</span>
              </div>
            </div>
          )}

          <div className="sa-tax-card-footer">
            <span className="sa-tax-meta-item">
              <Calendar size={13} aria-hidden="true" />
              {formatDate(top.created_at)}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
