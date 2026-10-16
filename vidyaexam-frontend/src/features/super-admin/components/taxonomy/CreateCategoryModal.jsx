import { useState } from "react";
import { FolderPlus } from "lucide-react";
import Modal from "../../../../shared/components/ui/Modal";
import toast from "../../../../shared/components/ui/toast";

export default function CreateCategoryModal({ isOpen, onClose, onSubmit }) {
  const [categoryName, setCategoryName] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setCategoryName("");
    setCategoryCode("");
    setDescription("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const name = categoryName.trim();
    const code = categoryCode.trim().toUpperCase().replace(/\s+/g, "_");

    if (!name) {
      const message = "Category Name is required.";
      setError(message);
      toast.warning("Please review the form", { description: message });
      return;
    }
    if (!code) {
      const message = "Category Code is required.";
      setError(message);
      toast.warning("Please review the form", { description: message });
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        category_name: name,
        category_code: code,
        description: description.trim() || undefined,
      });
      toast.success("Category created successfully");
      handleClose();
    } catch (err) {
      const message = err?.message || "Failed to create category";
      setError(message);
      toast.error("Unable to create category", { description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Exam Category"
      description="Add a new platform-level category for curriculum and exams (Super Admin only)."
      size="md"
      className="sa-taxonomy-modal"
      footer={
        <div className="sa-modal-footer-actions">
          <button
            type="button"
            className="sa-btn sa-btn--secondary"
            onClick={handleClose}
            disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className="sa-btn sa-btn--primary"
            onClick={handleSubmit}
            disabled={loading}>
            {loading ? "Creating..." : (
              <>
                <FolderPlus size={16} aria-hidden="true" />
                Create Category
              </>
            )}
          </button>
        </div>
      }>
      <form onSubmit={handleSubmit} className="sa-modal-form">
        {error && (
          <div className="sa-form-alert is-error" role="alert">
            {error}
          </div>
        )}

        <div className="sa-form-field">
          <label htmlFor="cat-name">
            Category Name <span className="sa-required-star">*</span>
          </label>
          <input
            id="cat-name"
            type="text"
            className="sa-input"
            placeholder="e.g. Engineering, Medical, Civil Services"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="sa-form-field">
          <label htmlFor="cat-code">
            Category Code <span className="sa-required-star">*</span>
          </label>
          <input
            id="cat-code"
            type="text"
            className="sa-input"
            placeholder="e.g. ENG, MED, UPSC"
            value={categoryCode}
            onChange={(e) => setCategoryCode(e.target.value.toUpperCase())}
            disabled={loading}
            required
          />
          <small className="sa-field-hint">
            Standard uppercase identifier code without spaces.
          </small>
        </div>

        <div className="sa-form-field">
          <label htmlFor="cat-desc">Description (Optional)</label>
          <textarea
            id="cat-desc"
            className="sa-textarea"
            rows={3}
            placeholder="Brief explanation of exams covered under this category..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </div>
      </form>
    </Modal>
  );
}
