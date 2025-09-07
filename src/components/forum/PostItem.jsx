import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { 
  ChevronUpIcon, 
  ChatBubbleLeftIcon, 
  EyeIcon,
  TagIcon,
  UserIcon 
} from '@heroicons/react/24/outline';
import { ChevronUpIcon as ChevronUpSolidIcon } from '@heroicons/react/24/solid';

const PostItem = ({ post, onPostClick, showFullContent = false }) => {
  const { user } = useAuth();
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(post.upvotes || 0);
  const [loading, setLoading] = useState(false);

  // Check if current user has upvoted this post
  useEffect(() => {
    const checkUpvoteStatus = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from('post_upvotes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .single();

        if (data) {
          setIsUpvoted(true);
        }
      } catch {
        // No upvote found, which is fine
        console.debug('No upvote found for this post');
      }
    };

    checkUpvoteStatus();
  }, [post.id, user]);

  const handleUpvote = async (e) => {
    e.stopPropagation(); // Prevent opening post detail
    
    if (!user) {
      alert('Please log in to upvote posts');
      return;
    }

    if (loading) return;
    
    setLoading(true);

    try {
      if (isUpvoted) {
        // Remove upvote
        const { error } = await supabase
          .from('post_upvotes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (error) throw error;

        setIsUpvoted(false);
        setUpvoteCount(prev => Math.max(0, prev - 1));
      } else {
        // Add upvote
        const { error } = await supabase
          .from('post_upvotes')
          .insert([{
            post_id: post.id,
            user_id: user.id
          }]);

        if (error) throw error;

        setIsUpvoted(true);
        setUpvoteCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling upvote:', error);
      alert('Failed to update upvote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'text-red-600 bg-red-100';
      case 'teacher': return 'text-purple-600 bg-purple-100';
      case 'staff': return 'text-blue-600 bg-blue-100';
      case 'student': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTagColor = (tag) => {
    switch (tag) {
      case 'academic': return 'text-blue-700 bg-blue-100';
      case 'technical': return 'text-purple-700 bg-purple-100';
      case 'events': return 'text-green-700 bg-green-100';
      case 'announcements': return 'text-red-700 bg-red-100';
      case 'general': return 'text-gray-700 bg-gray-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const formatContent = (content) => {
    if (showFullContent) return content;
    
    const maxLength = 200;
    if (content.length <= maxLength) return content;
    
    return content.substring(0, maxLength) + '...';
  };

  const handlePostClick = () => {
    if (onPostClick) {
      onPostClick(post);
    }
  };

  return (
    <article className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer" 
             onClick={handlePostClick}>
      <div className="flex items-start space-x-4">
        {/* Upvote Section */}
        <div className="flex flex-col items-center space-y-1 flex-shrink-0">
          <button
            onClick={handleUpvote}
            disabled={loading || !user}
            className={`p-2 rounded-full transition-colors duration-200 ${
              isUpvoted
                ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={user ? (isUpvoted ? 'Remove upvote' : 'Upvote post') : 'Login to upvote'}
          >
            {isUpvoted ? (
              <ChevronUpSolidIcon className="h-6 w-6" />
            ) : (
              <ChevronUpIcon className="h-6 w-6" />
            )}
          </button>
          <span className="text-sm font-medium text-gray-700">
            {upvoteCount}
          </span>
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <UserIcon className="h-4 w-4" />
                <span className="font-medium text-gray-700">
                  {post.profiles?.full_name || 'Unknown User'}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(post.profiles?.role)}`}>
                  {post.profiles?.role || 'user'}
                </span>
              </div>
              <span>•</span>
              <time dateTime={post.created_at} title={new Date(post.created_at).toLocaleString()}>
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </time>
            </div>

            {/* Tag */}
            {post.tag && (
              <div className="flex items-center space-x-1">
                <TagIcon className="h-4 w-4 text-gray-400" />
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTagColor(post.tag)}`}>
                  {post.tag}
                </span>
              </div>
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-gray-800 mb-2 hover:text-blue-600 transition-colors">
            {post.title}
          </h2>

          {/* Content Preview */}
          <div className="text-gray-600 mb-4 leading-relaxed">
            {formatContent(post.content)}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <ChatBubbleLeftIcon className="h-4 w-4" />
                <span>{post.comment_count || 0} comments</span>
              </div>
              <div className="flex items-center space-x-1">
                <EyeIcon className="h-4 w-4" />
                <span>Click to view</span>
              </div>
            </div>

            {!showFullContent && post.content.length > 200 && (
              <span className="text-blue-600 hover:text-blue-800 font-medium">
                Read more →
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default PostItem;
