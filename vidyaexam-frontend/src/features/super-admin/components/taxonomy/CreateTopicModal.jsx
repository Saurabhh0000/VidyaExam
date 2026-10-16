import { useState } from "react";
import { Layers } from "lucide-react";
import Modal from "../../../../shared/components/ui/Modal";
import toast from "../../../../shared/components/ui/toast";
import { TenantSelect } from "../TenantControls";

export default function CreateTopicModal({
  isOpen,
  onClose,
  subjects = [],
  initialSubjectId = "",
  onSubmit,
}) {
  const [subjectId, setSubjectId] = useState(
    initialSubjectId && initialSubjectId !== "ALL" ? initialSubjectId : ""
  );
  const [topicName, setTopicName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setSubjectId(
      initialSubjectId && initialSubjectId !== "ALL" ? initialSubjectId : ""
    );
    setTopicName("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!subjectId) {
      const message = "Please select a subject.";
      setError(message);
      toast.warning("Please review the form", { description: message });
      return;
    }
    const name = topicName.trim();
    if (!name) {
      const message = "Topic Name is required.";
      setError(message);
      toast.warning("Please review the form", { description: message });
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        subject_id: subjectId,
        topic_name: name,
      });
      toast.success("Topic created successfully");
      handleClose();
    } catch (err) {
      const message = err?.message || "Failed to create topic";
      setError(message);
      toast.error("Unable to create topic", { description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Syllabus Topic"
      description="Add a specific topic under a curriculum subject."
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
                <Layers size={16} aria-hidden="true" />
                Create Topic
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
          <label htmlFor="topic-subj">
            Parent Subject <span className="sa-required-star">*</span>
          </label>
          <TenantSelect
            id="topic-subj"
            value={subjectId}
            onChange={setSubjectId}
            label="Parent Subject"
            options={[
              { value: "", label: "Select subject" },
              ...subjects.map((subj) => ({
                value: String(subj.subject_id),
                label: `${subj.subject_name}${subj.category_name ? ` (${subj.category_name})` : ""}`,
              })),
            ]}
            disabled={loading}
          />
        </div>

        <div className="sa-form-field">
          <label htmlFor="topic-name">
            Topic Name <span className="sa-required-star">*</span>
          </label>
          <input
            id="topic-name"
            type="text"
            className="sa-input"
            placeholder="e.g. Thermodynamics, Percentage & Ratios, Optics"
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            disabled={loading}
            required
          />
        </div>
      </form>
    </Modal>
  );
}
