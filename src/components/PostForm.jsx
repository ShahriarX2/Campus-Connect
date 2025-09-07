import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, ChatBubbleLeftTextIcon, TagIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import PropTypes from 'prop-types';

const PostForm = ({ isOpen, onClose, onSubmit, editingPost = null }) => {
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tag: ''
  });
  const [errors, setErrors] = useState({});

  // Common tags for the forum
  const commonTags = [
    { value: '', label: 'No tag' },
    { value: 'general', label: 'General' },
    { value: 'academic', label: 'Academic' },
    { value: 'technical', label: 'Technical' },
    { value: 'events', label: 'Events' },
    { value: 'social', label: 'Social' },
    { value: 'resources', label: 'Resources' },
    { value: 'help', label: 'Help' },
    { value: 'discussion', label: 'Discussion' }
  ];

  // Initialize form data when editing
  useEffect(() => {
    if (editingPost) {
      setFormData({
        title: editingPost.title || '',
        content: editingPost.content || '',
        tag: editingPost.tag || ''
      });
    } else {
      // Reset form for new post
      setFormData({
        title: '',
        content: '',
        tag: ''
      });
    }
    setErrors({});
  }, [editingPost, isOpen]);

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Title must not exceed 255 characters';
    }

    // Content validation
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.trim().length < 10) {
      newErrors.content = 'Content must be at least 10 characters';
    }

    // Tag validation (optional but if provided, must be valid)
    if (formData.tag && !commonTags.some(tag => tag.value === formData.tag)) {
      newErrors.tag = 'Please select a valid tag';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const postData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        tag: formData.tag || null,
        posted_by: profile.id
      };

      await onSubmit(postData, editingPost?.id);

      toast.success(editingPost ? 'Post updated successfully!' : 'Post created successfully!');
      onClose();
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error(error.message || 'Failed to save post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get character counts for display
  const titleCount = formData.title.length;
  const contentCount = formData.content.length;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 dark:bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <ChatBubbleLeftTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {editingPost ? 'Edit Post' : 'Create New Post'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors duration-200"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                  <div className="space-y-6">
                    {/* Post Title */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Post Title *
                        </label>
                        <span className={`text-xs ${
                          titleCount > 240 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {titleCount}/255
                        </span>
                      </div>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Enter a descriptive title for your post"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                          errors.title ? 'border-red-500' : 'border-gray-300'
                        }`}
                        maxLength={255}
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
                      )}
                    </div>

                    {/* Category Tag */}
                    <div>
                      <label htmlFor="tag" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <TagIcon className="h-4 w-4 inline mr-1" />
                        Category Tag
                      </label>
                      <select
                        id="tag"
                        name="tag"
                        value={formData.tag}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                          errors.tag ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        {commonTags.map((tag) => (
                          <option key={tag.value} value={tag.value}>
                            {tag.label}
                          </option>
                        ))}
                      </select>
                      {errors.tag && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tag}</p>
                      )}
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Choose a category to help others find your post
                      </p>
                    </div>

                    {/* Post Content */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Content *
                        </label>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {contentCount} characters
                        </span>
                      </div>
                      <textarea
                        id="content"
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        rows={8}
                        placeholder="Share your thoughts, ask a question, or start a discussion..."
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                          errors.content ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.content && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.content}</p>
                      )}
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Be clear and specific. You can edit your post after publishing.
                      </p>
                    </div>

                    {/* Preview Section */}
                    {(formData.title.trim() || formData.content.trim()) && (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Preview:
                        </h4>
                        <div className="space-y-2">
                          {formData.title.trim() && (
                            <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {formData.title}
                            </h5>
                          )}
                          {formData.tag && (
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded-full">
                              {commonTags.find(t => t.value === formData.tag)?.label}
                            </span>
                          )}
                          {formData.content.trim() && (
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {formData.content.length > 200 
                                ? `${formData.content.substring(0, 200)}...`
                                : formData.content
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg transition-colors duration-200"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          {editingPost ? 'Updating...' : 'Publishing...'}
                        </span>
                      ) : (
                        editingPost ? 'Update Post' : 'Publish Post'
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

PostForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  editingPost: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    content: PropTypes.string,
    tag: PropTypes.string,
  }),
};

export default PostForm;
