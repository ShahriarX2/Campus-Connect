import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { UserIcon } from '@heroicons/react/24/outline';

const CommentItem = ({ comment }) => {
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'text-red-600 bg-red-100';
      case 'teacher': return 'text-purple-600 bg-purple-100';
      case 'staff': return 'text-blue-600 bg-blue-100';
      case 'student': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-3">
      {/* Comment Header */}
      <div className="flex items-center space-x-2 mb-3">
        <div className="flex items-center space-x-1 text-sm text-gray-500">
          <UserIcon className="h-4 w-4" />
          <span className="font-medium text-gray-700">
            {comment.profiles?.full_name || 'Unknown User'}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(comment.profiles?.role)}`}>
            {comment.profiles?.role || 'user'}
          </span>
        </div>
        <span className="text-gray-400">•</span>
        <time 
          dateTime={comment.created_at} 
          className="text-sm text-gray-500"
          title={new Date(comment.created_at).toLocaleString()}
        >
          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
        </time>
      </div>

      {/* Comment Content */}
      <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
        {comment.content}
      </div>
    </div>
  );
};

export default CommentItem;
