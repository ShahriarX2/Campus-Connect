import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  PlusIcon, 
  ChatBubbleLeftTextIcon, 
  MagnifyingGlassIcon,
  TagIcon,
  FunnelIcon,
  HandThumbUpIcon,
  ChatBubbleLeftIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import PostItem from '../components/PostItem';
import PostForm from '../components/PostForm';
import toast from 'react-hot-toast';

export const Forum = () => {
  const { profile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [userUpvotes, setUserUpvotes] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'popular', 'commented'

  // Available tags
  const availableTags = [
    { value: '', label: 'All Tags' },
    { value: 'general', label: 'General' },
    { value: 'academic', label: 'Academic' },
    { value: 'technical', label: 'Technical' },
    { value: 'events', label: 'Events' },
    { value: 'social', label: 'Social' },
    { value: 'resources', label: 'Resources' },
    { value: 'help', label: 'Help' },
    { value: 'discussion', label: 'Discussion' }
  ];

  // Fetch posts with details
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('forum_posts_with_details')
        .select('*');

      // Apply filters
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      if (selectedTag) {
        query = query.eq('tag', selectedTag);
      }

      // Apply sorting
      switch (sortBy) {
        case 'popular':
          query = query.order('upvotes', { ascending: false });
          break;
        case 'commented':
          query = query.order('comment_count', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedTag, sortBy]);

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

  // Create post
  const handleCreatePost = async (postData) => {
    try {
      const { error } = await supabase
        .from('forum_posts')
        .insert([postData]);

      if (error) throw error;

      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  };

  // Update post
  const handleUpdatePost = async (postData, postId) => {
    try {
      const { error } = await supabase
        .from('forum_posts')
        .update(postData)
        .eq('id', postId);

      if (error) throw error;

      toast.success('Post updated successfully!');
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  };

  // Delete post
  const handleDeletePost = async (postId) => {
    try {
      const { error } = await supabase
        .from('forum_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast.success('Post deleted successfully!');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
      throw error;
    }
  };

  // Handle upvote
  const handleUpvote = async (postId) => {
    if (!profile) {
      toast.error('Please login to upvote posts');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('toggle_post_upvote', {
        post_uuid: postId,
        user_uuid: profile.id
      });

      if (error) throw error;

      // Update local state
      setUserUpvotes(prev => {
        const newSet = new Set(prev);
        if (data) {
          newSet.add(postId);
          toast.success('Post upvoted!');
        } else {
          newSet.delete(postId);
          toast.success('Upvote removed');
        }
        return newSet;
      });
    } catch (error) {
      console.error('Error toggling upvote:', error);
      toast.error('Failed to update upvote');
    }
  };

  // Handle form submission
  const handleFormSubmit = async (postData, editId) => {
    if (editId) {
      await handleUpdatePost(postData, editId);
    } else {
      await handleCreatePost(postData);
    }
  };

  // Handle edit
  const handleEdit = (post) => {
    setEditingPost(post);
    setShowForm(true);
  };

  // Handle close form
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPost(null);
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedTag('');
    setSortBy('recent');
  };

  // Set up real-time subscriptions
  useEffect(() => {
    fetchPosts();
    fetchUserUpvotes();

    // Set up real-time subscription for posts
    const postsChannel = supabase
      .channel('forum_posts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'forum_posts'
        },
        (payload) => {
          console.log('Real-time post change:', payload);
          fetchPosts();
        }
      )
      .subscribe();

    // Set up real-time subscription for comments (to update comment counts)
    const commentsChannel = supabase
      .channel('forum_comments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'forum_comments'
        },
        (payload) => {
          console.log('Real-time comment change:', payload);
          fetchPosts();
        }
      )
      .subscribe();

    // Set up real-time subscription for upvotes
    const upvotesChannel = supabase
      .channel('post_upvotes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_upvotes'
        },
        () => {
          console.log('Real-time upvote change');
          fetchPosts();
          fetchUserUpvotes();
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(upvotesChannel);
    };
  }, [fetchPosts, fetchUserUpvotes]);

  // Get filtered posts based on current filters
  const getFilteredPostsCount = () => {
    let count = 0;
    if (searchQuery.trim() || selectedTag) {
      count = posts.length;
    } else {
      count = posts.length;
    }
    return count;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ChatBubbleLeftTextIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Campus Forum
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Share ideas, ask questions, and connect with your campus community
              </p>
            </div>
          </div>

          {/* Create Post Button */}
          {profile && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              <PlusIcon className="h-5 w-5" />
              <span>New Post</span>
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
              </div>
            </div>

            {/* Tag Filter */}
            <div>
              <div className="relative">
                <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 dark:bg-gray-700 dark:text-white appearance-none cursor-pointer"
                >
                  {availableTags.map((tag) => (
                    <option key={tag.value} value={tag.value}>
                      {tag.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sort By */}
            <div>
              <div className="relative">
                <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 dark:bg-gray-700 dark:text-white appearance-none cursor-pointer"
                >
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Upvoted</option>
                  <option value="commented">Most Commented</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filter Status */}
          {(searchQuery.trim() || selectedTag || sortBy !== 'recent') && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span>
                  Showing {getFilteredPostsCount()} post{getFilteredPostsCount() === 1 ? '' : 's'}
                  {searchQuery.trim() && ` matching "${searchQuery}"`}
                  {selectedTag && ` in "${availableTags.find(t => t.value === selectedTag)?.label}"`}
                </span>
              </div>
              <button
                onClick={handleClearFilters}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading posts...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <ChatBubbleLeftTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchQuery.trim() || selectedTag ? 'No posts found' : 'No posts yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery.trim() || selectedTag 
                ? 'Try adjusting your search terms or filters.'
                : 'Be the first to start a discussion!'}
            </p>
            {!searchQuery.trim() && !selectedTag && profile && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Create First Post
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostItem
                key={post.id}
                post={post}
                onEdit={handleEdit}
                onDelete={handleDeletePost}
                onUpvote={handleUpvote}
                userHasUpvoted={userUpvotes.has(post.id)}
              />
            ))}
          </div>
        )}

        {/* Quick Stats */}
        {posts.length > 0 && !loading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <SparklesIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
              Forum Stats
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {posts.length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total Posts
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {posts.reduce((sum, post) => sum + (post.upvotes || 0), 0)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total Upvotes
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {posts.reduce((sum, post) => sum + (post.comment_count || 0), 0)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total Comments
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Post Form Modal */}
        <PostForm
          isOpen={showForm}
          onClose={handleCloseForm}
          onSubmit={handleFormSubmit}
          editingPost={editingPost}
        />
      </div>
    </Layout>
  );
};
