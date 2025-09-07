import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  CalendarIcon, 
  UserIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  SpeakerWaveIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import PropTypes from 'prop-types';

const NoticeDetail = ({ notice, isOpen, onClose, onEdit, onDelete }) => {
  const { profile } = useAuth();

  if (!notice) return null;

  const getCategoryColor = (category) => {
    switch (category) {
      case 'exam':
        return {
          bg: 'bg-red-100 dark:bg-red-900/30',
          text: 'text-red-800 dark:text-red-200',
          border: 'border-red-200 dark:border-red-800',
          icon: '📝'
        };
      case 'class':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          text: 'text-blue-800 dark:text-blue-200',
          border: 'border-blue-200 dark:border-blue-800',
          icon: '📚'
        };
      case 'event':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          text: 'text-green-800 dark:text-green-200',
          border: 'border-green-200 dark:border-green-800',
          icon: '🎉'
        };
      case 'general':
        return {
          bg: 'bg-gray-100 dark:bg-gray-700/30',
          text: 'text-gray-800 dark:text-gray-200',
          border: 'border-gray-200 dark:border-gray-600',
          icon: '📢'
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-700/30',
          text: 'text-gray-800 dark:text-gray-200',
          border: 'border-gray-200 dark:border-gray-600',
          icon: '📢'
        };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-300';
      case 'high':
        return 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-900/20 dark:text-orange-300';
      case 'medium':
        return 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/20 dark:text-blue-300';
      case 'low':
        return 'bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-800/20 dark:text-gray-300';
      default:
        return 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/20 dark:text-blue-300';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateRelative = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return formatDate(dateString);
    }
  };

  const canModify = () => {
    return profile && 
           (profile.role === 'admin' || 
           (profile.role === 'teacher' && notice.posted_by === profile.id));
  };

  const isExpired = () => {
    return notice.expiry_date && new Date(notice.expiry_date) < new Date();
  };

  const categoryStyle = getCategoryColor(notice.category);

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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <SpeakerWaveIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        Notice Details
                      </h2>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Action buttons for authorized users */}
                      {canModify() && (
                        <>
                          <button
                            onClick={() => {
                              onEdit(notice);
                              onClose();
                            }}
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
                            title="Edit notice"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              onDelete(notice.id);
                              onClose();
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                            title="Delete notice"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      
                      <button
                        type="button"
                        className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                        onClick={onClose}
                        title="Close"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                  {/* Notice Header */}
                  <div className="mb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        {/* Category and Priority */}
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}>
                            <span className="text-sm">{categoryStyle.icon}</span>
                            <span className="text-sm font-medium capitalize">{notice.category}</span>
                          </div>
                          
                          {notice.priority && notice.priority !== 'medium' && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ring-1 ring-inset capitalize ${getPriorityColor(notice.priority)}`}>
                              {notice.priority} Priority
                            </span>
                          )}
                          
                          {notice.is_important && (
                            <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-900/20 dark:text-yellow-300">
                              <ExclamationTriangleIcon className="h-3 w-3" />
                              <span>Important</span>
                            </span>
                          )}
                        </div>
                        
                        {/* Title */}
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          {notice.title}
                        </h1>
                      </div>
                    </div>

                    {/* Meta Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      {/* Author */}
                      <div className="flex items-center space-x-2">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notice.author?.name || 'Unknown Author'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Author</p>
                        </div>
                      </div>

                      {/* Published Date */}
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDateRelative(notice.created_at)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(notice.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Expiry Date */}
                      {notice.expiry_date && (
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className={`text-sm font-medium ${isExpired() ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                              {isExpired() ? 'Expired' : 'Valid until'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(notice.expiry_date)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Expired Notice Warning */}
                    {isExpired() && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                          <p className="text-sm font-medium text-red-800 dark:text-red-200">
                            This notice has expired and may no longer be relevant.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notice Content */}
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {notice.content}
                    </div>
                  </div>

                  {/* Target Audience */}
                  {notice.target_audience && notice.target_audience !== 'all' && (
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                        Target Audience
                      </h3>
                      <p className="text-sm text-blue-800 dark:text-blue-300 capitalize">
                        This notice is specifically for {notice.target_audience}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {notice.updated_at !== notice.created_at && (
                        <span>Last updated: {formatDate(notice.updated_at)}</span>
                      )}
                    </p>
                    <button
                      type="button"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                      onClick={onClose}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

NoticeDetail.propTypes = {
  notice: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    category: PropTypes.oneOf(['exam', 'class', 'event', 'general']).isRequired,
    priority: PropTypes.oneOf(['low', 'medium', 'high', 'urgent']),
    is_important: PropTypes.bool,
    target_audience: PropTypes.oneOf(['all', 'students', 'teachers', 'admins']),
    status: PropTypes.oneOf(['draft', 'active', 'archived', 'expired']),
    expiry_date: PropTypes.string,
    posted_by: PropTypes.string.isRequired,
    created_at: PropTypes.string.isRequired,
    updated_at: PropTypes.string.isRequired,
    author: PropTypes.shape({
      name: PropTypes.string,
    }),
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default NoticeDetail;
