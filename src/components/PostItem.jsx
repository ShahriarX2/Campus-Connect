import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  HandThumbUpIcon,
  ChatBubbleLeftIcon,
  UserIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import PropTypes from 'prop-types';

const PostItem = ({ 
  post, 
  onEdit, 
  onDelete, 
  onUpvote,
  userHasUpvoted = false,
  showActions = true 
}) => {
  const { profile } = useAuth();
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if user can modify this post
  const canModify = () => {
    return profile && 
           (profile.role === 'admin' || post.posted_by === profile.id);
  };

  // Handle upvote
  const handleUpvote = async (e) => {
    e.preventDefault(); // Prevent navigation when clicking upvote
    e.stopPropagation();
    
    if (!profile) return;
    
    setIsUpvoting(true);
    try {
      await onUpvote(post.id);
    } finally {
      setIsUpvoting(false);
    }
  };

  // Handle delete
  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      setIsDeleting(true);
      try {
        await onDelete(post.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Handle edit
  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(post);
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
        day: 'numeric'
      });
    }
  };

  // Get tag style
  const getTagStyle = (tag) => {
    const tagStyles = {
      general: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      academic: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      technical: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      events: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
      social: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300',
      resources: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      help: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
      discussion: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300'
    };
    
    return tagStyles[tag] || tagStyles.general;
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
    if (post.author_avatar) {
      return (
        <img
          src={post.author_avatar}
          alt={post.author_name}
          className="h-10 w-10 rounded-full object-cover"
        />
      );
    } else {
      const initials = post.author_name
        ? post.author_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';
      
      return (
        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {initials}
          </span>
        </div>
      );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden">
      <Link to={`/forum/${post.id}`} className="block">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                {/* Author Avatar */}
                <div className="flex-shrink-0">
                  {getAvatarDisplay()}
                </div>
                
                {/* Author Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {post.author_name || 'Unknown User'}
                    </p>
                    {getRoleBadge(post.author_role)}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <CalendarIcon className="h-3 w-3" />
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                {post.title}
              </h3>

              {/* Tag */}
              {post.tag && (
                <div className="mb-3">
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getTagStyle(post.tag)}`}>
                    <TagIcon className="h-3 w-3" />
                    <span className="capitalize">{post.tag}</span>
                  </span>
                </div>
              )}

              {/* Content Preview */}
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {post.content.length > 200
                  ? `${post.content.substring(0, 200)}...`
                  : post.content}
              </p>
            </div>

            {/* Action Buttons for Author/Admin */}
            {showActions && canModify() && (
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={handleEdit}
                  className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200"
                  title="Edit post"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete post"
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

          {/* Engagement Stats */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              {/* Upvote Button */}
              <button
                onClick={handleUpvote}
                disabled={isUpvoting || !profile}
                className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  userHasUpvoted
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                title={profile ? (userHasUpvoted ? 'Remove upvote' : 'Upvote this post') : 'Login to upvote'}
              >
                {isUpvoting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                ) : userHasUpvoted ? (
                  <HandThumbUpSolidIcon className="h-4 w-4" />
                ) : (
                  <HandThumbUpIcon className="h-4 w-4" />
                )}
                <span>{post.upvotes || 0}</span>
              </button>

              {/* Comments Count */}
              <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                <ChatBubbleLeftIcon className="h-4 w-4" />
                <span className="text-sm">{post.comment_count || 0} {post.comment_count === 1 ? 'comment' : 'comments'}</span>
              </div>
            </div>

            {/* Read More Link */}
            {post.content.length > 200 && (
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300">
                Read more →
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

PostItem.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    tag: PropTypes.string,
    upvotes: PropTypes.number,
    posted_by: PropTypes.string.isRequired,
    created_at: PropTypes.string.isRequired,
    author_name: PropTypes.string,
    author_role: PropTypes.string,
    author_avatar: PropTypes.string,
    comment_count: PropTypes.number,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onUpvote: PropTypes.func.isRequired,
  userHasUpvoted: PropTypes.bool,
  showActions: PropTypes.bool,
};

export default PostItem;
