import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import PostItem from './PostItem';
import CommentItem from './CommentItem';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const PostDetail = ({ post, onBack }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch comments for this post
  useEffect(() => {
    if (!post?.id) return;

    const fetchComments = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('forum_comments')
          .select(`
            *,
            profiles:commented_by (
              id,
              full_name,
              role
            )
          `)
          .eq('post_id', post.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setComments(data || []);
      } catch (error) {
        console.error('Error fetching comments:', error);
        setError('Failed to load comments');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();

    // Set up real-time subscription for new comments
    const subscription = supabase
      .channel(`comments-${post.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forum_comments',
          filter: `post_id=eq.${post.id}`
        },
        async (payload) => {
          // Fetch the full comment with profile data
          const { data, error } = await supabase
            .from('forum_comments')
            .select(`
              *,
              profiles:commented_by (
                id,
                full_name,
                role
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data && !error) {
            setComments(prev => [...prev, data]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [post?.id]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to comment');
      return;
    }
    
    if (!commentContent.trim()) {
      setError('Comment cannot be empty');
      return;
    }
    
    if (commentContent.trim().length < 3) {
      setError('Comment must be at least 3 characters long');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      const { data, error } = await supabase
        .from('forum_comments')
        .insert([
          {
            post_id: post.id,
            content: commentContent.trim(),
            commented_by: user.id
          }
        ])
        .select(`
          *,
          profiles:commented_by (
            id,
            full_name,
            role
          )
        `)
        .single();

      if (error) throw error;

      // Clear the form
      setCommentContent('');
      
      // The comment will be added to the list via real-time subscription
      // But add it immediately for better UX
      setComments(prev => [...prev, data]);
      
    } catch (error) {
      console.error('Error creating comment:', error);
      setError('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentChange = (e) => {
    setCommentContent(e.target.value);
    if (error) setError(''); // Clear error when user starts typing
  };

  if (!post) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Post not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span>Back to Forum</span>
        </button>
      </div>

      {/* Post Detail */}
      <div className="mb-8">
        <PostItem post={post} showFullContent={true} />
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          Comments ({comments.length})
        </h3>

        {/* Comment Form */}
        {user ? (
          <form onSubmit={handleSubmitComment} className="mb-6">
            <div className="mb-4">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Add a comment
              </label>
              <textarea
                id="comment"
                rows={3}
                value={commentContent}
                onChange={handleCommentChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Share your thoughts..."
                disabled={submitting}
              />
              {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {commentContent.length}/1000 characters
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !commentContent.trim()}
                className={`px-4 py-2 rounded-md font-medium ${
                  submitting || !commentContent.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                } transition-colors`}
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-gray-600">Please log in to comment on this post.</p>
          </div>
        )}

        {/* Comments List */}
        {loading ? (
          <div className="text-center py-4">
            <p className="text-gray-600">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map(comment => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetail;
