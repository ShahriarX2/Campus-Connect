import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  HandThumbUpIcon,
  ChatBubbleLeftIcon,
  UserIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpSolidIcon } from '@heroicons/react/24/solid';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import CommentItem from '../components/CommentItem';
import toast from 'react-hot-toast';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [userUpvotes, setUserUpvotes] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [isUpvoting, setIsUpvoting] = useState(false);

  // Fetch post with details
  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('forum_posts_with_details')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setPost(data);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Failed to load post');
      navigate('/forum');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  // Fetch comments with details
  const fetchComments = useCallback(async () => {
    try {
      setCommentsLoading(true);
      const { data, error } = await supabase
        .from('forum_comments_with_details')
        .select('*')
        .eq('post_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setCommentsLoading(false);
    }
  }, [id]);

  // Fetch user's upvotes
  const fetchUserUpvotes = useCallback(async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('post_upvotes')
        .select('post_id')
        .eq('user_id', profile.id);

      if (error) throw error;

      setUserUpvotes(new Set(data?.map(u => u.post_id) || []));
    } catch (error) {
      console.error('Error fetching user upvotes:', error);
    }
  }, [profile]);

  // Handle upvote
  const handleUpvote = async () => {
    if (!profile || !post) return;
    
    setIsUpvoting(true);
    try {
      const { data, error } = await supabase.rpc('toggle_post_upvote', {
        post_uuid: post.id,
        user_uuid: profile.id
      });

      if (error) throw error;

      // Update local state
      setUserUpvotes(prev => {
        const newSet = new Set(prev);
        if (data) {
          newSet.add(post.id);
          toast.success('Post upvoted!');
        } else {
          newSet.delete(post.id);
          toast.success('Upvote removed');
        }
        return newSet;
      });

      // Refresh post data to get updated count
      await fetchPost();
    } catch (error) {
      console.error('Error toggling upvote:', error);
      toast.error('Failed to update upvote');
    } finally {
      setIsUpvoting(false);
    }
  };

  // Handle comment submission
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setIsSubmittingComment(true);
    try {
      const commentData = {
        post_id: id,
        content: newComment.trim(),
        posted_by: profile.id
      };

      const { error } = await supabase
        .from('forum_comments')
        .insert([commentData]);

      if (error) throw error;

      setNewComment('');
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle comment edit
  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setNewComment(comment.content);
  };

  // Handle comment update
  const handleUpdateComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setIsSubmittingComment(true);
    try {
      const { error } = await supabase
        .from('forum_comments')
        .update({ content: newComment.trim() })
        .eq('id', editingComment.id);

      if (error) throw error;

      setNewComment('');
      setEditingComment(null);
      toast.success('Comment updated!');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle comment delete
  const handleDeleteComment = async (commentId) => {
    try {
      const { error } = await supabase
        .from('forum_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingComment(null);
    setNewComment('');
  };

  // Set up real-time subscriptions
  useEffect(() => {
    fetchPost();
    fetchComments();
    fetchUserUpvotes();

    // Set up real-time subscription for the post
    const postChannel = supabase
      .channel(`post-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'forum_posts',
          filter: `id=eq.${id}`
        },
        () => {
          console.log('Post updated');
          fetchPost();
        }
      )
      .subscribe();

    // Set up real-time subscription for comments
    const commentsChannel = supabase
      .channel(`comments-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'forum_comments',
          filter: `post_id=eq.${id}`
        },
        (payload) => {
          console.log('Comment change:', payload);
          fetchComments();
          // Also update post to get new comment count
          fetchPost();
        }
      )
      .subscribe();

    // Set up real-time subscription for upvotes
    const upvotesChannel = supabase
      .channel(`upvotes-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_upvotes',
          filter: `post_id=eq.${id}`
        },
        () => {
          console.log('Upvote changed');
          fetchPost();
          fetchUserUpvotes();
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(postChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(upvotesChannel);
    };
  }, [id, fetchPost, fetchComments, fetchUserUpvotes]);

  // Helper functions
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

  const getAvatarDisplay = (user) => {
    if (user?.author_avatar) {
      return (
        <img
          src={user.author_avatar}
          alt={user.author_name}
          className="h-12 w-12 rounded-full object-cover"
        />
      );
    } else {
      const initials = user?.author_name
        ? user.author_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';
      
      return (
        <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {initials}
          </span>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading post...</span>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Post not found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            The post you're looking for doesn't exist or has been deleted.
          </p>
          <button
            onClick={() => navigate('/forum')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Back to Forum
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/forum')}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Back to Forum</span>
        </button>

        {/* Post Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            {/* Post Header */}
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0">
                {getAvatarDisplay(post)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                    {post.author_name || 'Unknown User'}
                  </h4>
                  {getRoleBadge(post.author_role)}
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{formatDate(post.created_at)}</span>
                  {post.updated_at !== post.created_at && (
                    <span className="text-gray-400 dark:text-gray-500">(edited)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Post Title */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {post.title}
            </h1>

            {/* Post Tag */}
            {post.tag && (
              <div className="mb-4">
                <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getTagStyle(post.tag)}`}>
                  <TagIcon className="h-4 w-4" />
                  <span className="capitalize">{post.tag}</span>
                </span>
              </div>
            )}

            {/* Post Content */}
            <div className="prose prose-gray dark:prose-invert max-w-none mb-6">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            </div>

            {/* Post Engagement */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                {/* Upvote Button */}
                <button
                  onClick={handleUpvote}
                  disabled={isUpvoting || !profile}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    userUpvotes.has(post.id)
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                  title={profile ? (userUpvotes.has(post.id) ? 'Remove upvote' : 'Upvote this post') : 'Login to upvote'}
                >
                  {isUpvoting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent"></div>
                  ) : userUpvotes.has(post.id) ? (
                    <HandThumbUpSolidIcon className="h-5 w-5" />
                  ) : (
                    <HandThumbUpIcon className="h-5 w-5" />
                  )}
                  <span>{post.upvotes || 0} {post.upvotes === 1 ? 'upvote' : 'upvotes'}</span>
                </button>

                {/* Comments Count */}
                <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                  <ChatBubbleLeftIcon className="h-5 w-5" />
                  <span>{post.comment_count || 0} {post.comment_count === 1 ? 'comment' : 'comments'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Comments ({comments.length})
            </h3>

            {/* Add Comment Form */}
            {profile && (
              <form onSubmit={editingComment ? handleUpdateComment : handleSubmitComment} className="mb-6">
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    {getAvatarDisplay({ author_avatar: profile.avatar_url, author_name: profile.name })}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={editingComment ? "Edit your comment..." : "Write a comment..."}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    />
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-2">
                        {editingComment && (
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmittingComment || !newComment.trim()}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors duration-200"
                      >
                        {isSubmittingComment ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <PaperAirplaneIcon className="h-4 w-4" />
                        )}
                        <span>{editingComment ? 'Update' : 'Comment'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Comments List */}
            {commentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading comments...</span>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8">
                <ChatBubbleLeftIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No comments yet
                </h4>
                <p className="text-gray-500 dark:text-gray-400">
                  {profile ? 'Be the first to comment!' : 'Login to join the discussion.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onEdit={handleEditComment}
                    onDelete={handleDeleteComment}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PostDetail;
