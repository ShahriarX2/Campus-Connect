import { useState } from 'react';
import { PencilIcon, TrashIcon, CalendarIcon, UserIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import PropTypes from 'prop-types';

const NoticeCard = ({ notice, onEdit, onDelete, onViewDetails }) => {
  const { profile } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const getCategoryColor = (category) => {
    switch (category) {
      case 'exam':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'class':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'event':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'general':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canModify = () => {
    return profile && 
           (profile.role === 'admin' || 
           (profile.role === 'teacher' && notice.posted_by === profile.id));
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      setIsDeleting(true);
      try {
        await onDelete(notice.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 cursor-pointer"
      onClick={() => onViewDetails(notice)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getCategoryColor(notice.category)}`}>
              {notice.category}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {notice.title}
          </h3>
        </div>
        
        {/* Action Buttons */}
        {canModify() && (
          <div className="flex space-x-2 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(notice);
              }}
              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200"
              title="Edit notice"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              disabled={isDeleting}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete notice"
            >
              {isDeleting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent"></div>
              ) : (
                <TrashIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Content Preview */}
      <div className="mb-4">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {notice.content && notice.content.length > 150
            ? `${notice.content.substring(0, 150)}...`
            : notice.content}
        </p>
        {notice.content && notice.content.length > 150 && (
          <button
            onClick={() => onViewDetails(notice)}
            className="inline-flex items-center space-x-1 mt-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors duration-200"
          >
            <EyeIcon className="h-4 w-4" />
            <span>Read More</span>
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          {/* Author */}
          <div className="flex items-center space-x-1">
            <UserIcon className="h-4 w-4" />
            <span>
              {notice.author ? notice.author.name || 'Unknown Author' : 'Loading...'}
            </span>
          </div>
          
          {/* Date */}
          <div className="flex items-center space-x-1">
            <CalendarIcon className="h-4 w-4" />
            <span>{formatDate(notice.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

NoticeCard.propTypes = {
  notice: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    category: PropTypes.oneOf(['exam', 'class', 'event', 'general']).isRequired,
    posted_by: PropTypes.string.isRequired,
    created_at: PropTypes.string.isRequired,
    author: PropTypes.shape({
      name: PropTypes.string,
    }),
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
};

export default NoticeCard;
