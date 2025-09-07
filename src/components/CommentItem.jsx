import { useState } from 'react';
import { 
  CalendarIcon,
  PencilIcon,
  TrashIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import PropTypes from 'prop-types';

const CommentItem = ({ 
  comment, 
  onEdit, 
  onDelete, 
  showActions = true 
}) => {
  const { profile } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if user can modify this comment
  const canModify = () => {
    return profile && 
           (profile.role === 'admin' || comment.posted_by === profile.id);
  };

  // Handle delete
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      setIsDeleting(true);
      try {
        await onDelete(comment.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Handle edit
  const handleEdit = () => {
    onEdit(comment);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Get role badge
  const getRoleBadge = (role) => {
    const roleConfig = {
      student: {
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
        label: 'Student'
      },
      teacher: {
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
        label: 'Teacher'
      },
      admin: {
        color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
        label: 'Admin'
      }
    };

    const config = roleConfig[role] || roleConfig.student;

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Get avatar or initials
  const getAvatarDisplay = () => {
    if (comment.author_avatar) {
      return (
        <img
          src={comment.author_avatar}
          alt={comment.author_name}
          className="h-8 w-8 rounded-full object-cover"
        />
      );
    } else {
      const initials = comment.author_name
        ? comment.author_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';
      
      return (
        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {initials}
          </span>
        </div>
      );
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1">
          {/* Author Avatar */}
          <div className="flex-shrink-0">
            {getAvatarDisplay()}
          </div>
          
          {/* Author Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2 flex-wrap">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {comment.author_name || 'Unknown User'}
              </p>
              {getRoleBadge(comment.author_role)}
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              <CalendarIcon className="h-3 w-3" />
              <span>{formatDate(comment.created_at)}</span>
              {comment.updated_at !== comment.created_at && (
                <span className="text-gray-400 dark:text-gray-500">(edited)</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons for Author/Admin */}
        {showActions && canModify() && (
          <div className="flex space-x-1 ml-2">
            <button
              onClick={handleEdit}
              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200"
              title="Edit comment"
            >
              <PencilIcon className="h-3 w-3" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete comment"
            >
              {isDeleting ? (
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-red-500 border-t-transparent"></div>
              ) : (
                <TrashIcon className="h-3 w-3" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Comment Content */}
      <div className="ml-11">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
          {comment.content}
        </p>
      </div>
    </div>
  );
};

CommentItem.propTypes = {
  comment: PropTypes.shape({
    id: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    posted_by: PropTypes.string.isRequired,
    created_at: PropTypes.string.isRequired,
    updated_at: PropTypes.string.isRequired,
    author_name: PropTypes.string,
    author_role: PropTypes.string,
    author_avatar: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  showActions: PropTypes.bool,
};

export default CommentItem;
