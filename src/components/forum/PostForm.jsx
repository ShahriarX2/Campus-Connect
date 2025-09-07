import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const PostForm = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tag: 'general'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const tags = [
    { value: 'general', label: 'General Discussion' },
    { value: 'academic', label: 'Academic' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'events', label: 'Campus Events' },
    { value: 'announcements', label: 'Announcements' }
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Title must be less than 255 characters';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.length < 10) {
      newErrors.content = 'Content must be at least 10 characters long';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    if (!user) {
      setErrors({ general: 'You must be logged in to create a post' });
      return;
    }
    
    setLoading(true);
    setErrors({});
    setSuccess(false);
    
    try {
      console.log('Creating post...', {
        title: formData.title.trim(),
        content: formData.content.trim(),
        tag: formData.tag,
        posted_by: user.id
      });
      
      const { data, error } = await supabase
        .from('forum_posts')
        .insert([
          {
            title: formData.title.trim(),
            content: formData.content.trim(),
            tag: formData.tag,
            posted_by: user.id
          }
        ])
        .select(`
          *,
          profiles:posted_by (
            id,
            full_name,
            role
          )
        `)
        .single();

      if (error) {
        console.error('Supabase error creating post:', error);
        throw error;
      }

      console.log('Post created successfully:', data);

      // Add comment_count property for consistency with the forum posts view
      const postWithCommentCount = {
        ...data,
        comment_count: 0
      };

      // Reset form immediately
      setFormData({
        title: '',
        content: '',
        tag: 'general'
      });

      // Notify parent component immediately with the new post
      if (onPostCreated) {
        console.log('Notifying parent component of new post');
        onPostCreated(postWithCommentCount);
      }
      
      // Show success state
      setSuccess(true);
      
      // Small delay to ensure the post appears before showing success message
      setTimeout(() => {
        console.log('Post creation process completed');
        setSuccess(false); // Reset success state after a moment
      }, 2000);

    } catch (error) {
      console.error('Error creating post:', error);
      setErrors({ general: 'Failed to create post. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New Post</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">{errors.general}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-green-600 text-sm">✅ Post created successfully! It should appear in the forum now.</p>
          </div>
        )}
        
        {/* Title Field */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.title ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter post title..."
            disabled={loading}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        {/* Tag Field */}
        <div>
          <label htmlFor="tag" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="tag"
            name="tag"
            value={formData.tag}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {tags.map(tag => (
              <option key={tag.value} value={tag.value}>
                {tag.label}
              </option>
            ))}
          </select>
        </div>

        {/* Content Field */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content *
          </label>
          <textarea
            id="content"
            name="content"
            rows={6}
            value={formData.content}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.content ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="Write your post content here..."
            disabled={loading}
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {formData.content.length}/2000 characters
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          {success && (
            <div className="flex items-center text-green-600 text-sm">
              <span className="animate-pulse">✅ Post created!</span>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading || !user || success}
            className={`px-6 py-2 rounded-md font-medium flex items-center space-x-2 ${
              loading || !user || success
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            } transition-colors`}
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>
              {loading ? 'Creating Post...' : success ? 'Post Created!' : 'Create Post'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostForm;
