import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import PropTypes from "prop-types";

const NoticeForm = ({ isOpen, onClose, onSubmit, editingNotice }) => {
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "general",
  });

  // Update form data when editing notice changes
  useEffect(() => {
    if (editingNotice) {
      setFormData({
        title: editingNotice.title || "",
        content: editingNotice.description || "",
        category: editingNotice.category || "general",
      });
    } else {
      setFormData({
        title: "",
        content: "",
        category: "general",
      });
    }
  }, [editingNotice]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return false;
    }
    if (!formData.content.trim()) {
      toast.error("Description is required");
      return false;
    }
    if (formData.title.length > 200) {
      toast.error("Title must be less than 200 characters");
      return false;
    }
    if (formData.content.length > 2000) {
      toast.error("Description must be less than 2000 characters");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const noticeData = {
        ...formData,
        posted_by: profile.id,
      };

      await onSubmit(noticeData, editingNotice?.id);

      // Reset form
      setFormData({
        title: "",
        content: "",
        category: "general",
      });

      toast.success(
        editingNotice
          ? "Notice updated successfully!"
          : "Notice created successfully!"
      );
      onClose();
    } catch (error) {
      toast.error(
        `Failed to ${editingNotice ? "update" : "create"} notice: ${
          error.message
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        title: "",
        content: "",
        category: "general",
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editingNotice ? "Edit Notice" : "Create Notice"}
          </h3>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto"
        >
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={200}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter notice title"
            />
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
              {formData.title.length}/200
            </div>
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              required
              value={formData.category}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="general">General</option>
              <option value="exam">Exam</option>
              <option value="class">Class</option>
              <option value="event">Event</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              name="content"
              required
              value={formData.content}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={2000}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              placeholder="Enter notice content..."
            />
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
              {formData.content.length}/2000
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center justify-center disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  {editingNotice ? "Updating..." : "Creating..."}
                </>
              ) : editingNotice ? (
                "Update Notice"
              ) : (
                "Create Notice"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

NoticeForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  editingNotice: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    category: PropTypes.oneOf(["exam", "class", "event", "general"]),
  }),
};

export default NoticeForm;
