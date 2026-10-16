import { useState } from "react";
import { BookOpen } from "lucide-react";
import Modal from "../../../../shared/components/ui/Modal";
import toast from "../../../../shared/components/ui/toast";
import { TenantSelect } from "../TenantControls";

export default function CreateSubjectModal({
  isOpen,
  onClose,
  categories = [],
  initialCategoryId = "",
  onSubmit,
}) {
  const [categoryId, setCategoryId] = useState(
    initialCategoryId && initialCategoryId !== "ALL" ? initialCategoryId : ""
  );
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setCategoryId(
      initialCategoryId && initialCategoryId !== "ALL" ? initialCategoryId : ""
    );
    setSubjectName("");
    setSubjectCode("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!categoryId) {
      setError("Please select an exam category.");
      return;
    }
    const name = subjectName.trim();
    if (!name) {
      setError("Subject Name is required.");
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        category_id: categoryId,
        subject_name: name,
        subject_code: subjectCode.trim() ? subjectCode.trim().toUpperCase() : null,
      });
      toast.success("Subject created successfully");
      handleClose();
    } catch (err) {
      setError(err?.message || "Failed to create subject");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Curriculum Subject"
      description="Add a new subject mapped to a specific exam category."
      size="md"
      className="sa-taxonomy-modal"
      footer={
        <div className="sa-modal-footer-actions">
          <button
            type="button"
            className="sa-btn sa-btn--secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="sa-btn sa-btn--primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Creating..." : (
              <>
                <BookOpen size={16} aria-hidden="true" />
                Create Subject
              </>
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="sa-modal-form">
        {error && (
          <div className="sa-form-alert is-error" role="alert">
            {error}
          </div>
        )}

        <div className="sa-form-field">
          <label htmlFor="subj-cat">
            Parent Category <span className="sa-required-star">*</span>
          </label>
          <TenantSelect
            id="subj-cat"
            value={categoryId}
            onChange={setCategoryId}
            label="Parent Category"
            options={[
              { value: "", label: "Select exam category" },
              ...categories.map((cat) => ({
                value: String(cat.category_id),
                label: `${cat.category_name} (${cat.category_code})`,
              })),
            ]}
            disabled={loading}
          />
        </div>

        <div className="sa-form-field">
          <label htmlFor="subj-name">
            Subject Name <span className="sa-required-star">*</span>
          </label>
          <input
            id="subj-name"
            type="text"
            className="sa-input"
            placeholder="e.g. Physics, Quantitative Aptitude, Anatomy"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="sa-form-field">
          <label htmlFor="subj-code">Subject Code (Optional)</label>
          <input
            id="subj-code"
            type="text"
            className="sa-input"
            placeholder="e.g. PHY, QA, BIO"
            value={subjectCode}
            onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
            disabled={loading}
          />
        </div>
      </form>
    </Modal>
  );
}
