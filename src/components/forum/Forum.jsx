import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import PostForm from './PostForm';
import PostItem from './PostItem';
import PostDetail from './PostDetail';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  PlusIcon 
} from '@heroicons/react/24/outline';

const Forum = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'popular', 'most_commented'
  const [newPostNotification, setNewPostNotification] = useState(null);

  const tags = [
    { value: 'all', label: 'All Posts' },
    { value: 'general', label: 'General Discussion' },
    { value: 'academic', label: 'Academic' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'events', label: 'Campus Events' },
    { value: 'announcements', label: 'Announcements' }
  ];

  // Fetch posts with filtering and sorting
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Set up real-time subscriptions
  useEffect(() => {
    // Subscribe to new posts
    const postsSubscription = supabase
      .channel('forum-posts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forum_posts'
        },
        async (payload) => {
          console.log('New post inserted via real-time:', payload);
          
          // Fetch the full post with profile data and comment count
          try {
            const { data, error } = await supabase
              .from('forum_posts_with_details')
              .select('*')
              .eq('id', payload.new.id)
              .single();

            if (data && !error) {
              // Add to beginning of posts array if not already present
              setPosts(prev => {
                const exists = prev.some(post => post.id === data.id);
                if (exists) return prev;
                
                // Show notification for new post from other users
                if (data.posted_by !== user?.id) {
                  setNewPostNotification({
                    id: data.id,
                    title: data.title,
                    author: data.full_name || 'Someone'
                  });
                  
                  // Auto-hide notification after 5 seconds
                  setTimeout(() => {
                    setNewPostNotification(null);
                  }, 5000);
                }
                
                return [data, ...prev];
              });
            } else {
              console.error('Error fetching new post details:', error);
            }
          } catch (error) {
            console.error('Error in real-time post insertion:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'forum_posts'
        },
        async (payload) => {
          console.log('Post updated via real-time:', payload);
          
          // Update the post in the list with fresh data
          try {
            const { data, error } = await supabase
              .from('forum_posts_with_details')
              .select('*')
              .eq('id', payload.new.id)
              .single();

            if (data && !error) {
              setPosts(prev => prev.map(post => 
                post.id === data.id ? data : post
              ));
            }
          } catch (error) {
            console.error('Error updating post via real-time:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from real-time posts');
      postsSubscription.unsubscribe();
    };
  }, [user?.id]); // Include user?.id as it's used in the effect

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('forum_posts_with_details')
        .select('*');

      // Apply tag filter
      if (selectedTag !== 'all') {
        query = query.eq('tag', selectedTag);
      }

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      // Apply sorting
      switch (sortBy) {
        case 'popular':
          query = query.order('upvotes', { ascending: false });
          break;
        case 'most_commented':
          query = query.order('comment_count', { ascending: false });
          break;
        case 'recent':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedTag, sortBy]);

  const handlePostCreated = (newPost) => {
    console.log('Post created callback received:', newPost);
    
    // Immediately add the new post to the beginning of the list (optimistic update)
    setPosts(prev => {
      // Check if post already exists to avoid duplicates
      const exists = prev.some(post => post.id === newPost.id);
      if (exists) {
        console.log('Post already exists in list, updating instead');
        return prev.map(post => post.id === newPost.id ? newPost : post);
      }
      console.log('Adding new post to list');
      return [newPost, ...prev];
    });
    
    // Close the form
    setShowPostForm(false);
    
    // Show success feedback
    console.log('Post successfully added to forum');
    
    // Show brief success notification for own posts
    setNewPostNotification({
      id: newPost.id,
      title: newPost.title,
      author: 'You',
      isOwnPost: true
    });
    
    // Auto-hide notification after 3 seconds for own posts
    setTimeout(() => {
      setNewPostNotification(null);
    }, 3000);
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  const handleBackToForum = () => {
    setSelectedPost(null);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is handled by the useEffect that watches searchQuery
  };

  // If viewing a specific post, show PostDetail
  if (selectedPost) {
    return <PostDetail post={selectedPost} onBack={handleBackToForum} />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Campus Forum</h1>
          {user && (
            <button
              onClick={() => setShowPostForm(!showPostForm)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              <span>{showPostForm ? 'Cancel' : 'New Post'}</span>
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filter by:</span>
            </div>
            
            {/* Tag Filter */}
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {tags.map(tag => (
                <option key={tag.value} value={tag.value}>
                  {tag.label}
                </option>
              ))}
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
              <option value="most_commented">Most Commented</option>
            </select>
          </div>
        </div>
      </div>

      {/* New Post Notification */}
      {newPostNotification && (
        <div className={`mb-4 p-4 rounded-lg shadow-md border-l-4 ${
          newPostNotification.isOwnPost 
            ? 'bg-green-50 border-green-400 text-green-700'
            : 'bg-blue-50 border-blue-400 text-blue-700'
        } animate-pulse`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {newPostNotification.isOwnPost 
                  ? '✅ Your post has been published!' 
                  : `🆕 New post from ${newPostNotification.author}`}
              </p>
              <p className="text-sm mt-1">
                "{newPostNotification.title}"
              </p>
            </div>
            <button
              onClick={() => setNewPostNotification(null)}
              className="text-gray-400 hover:text-gray-600 ml-4"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Post Form */}
      {showPostForm && (
        <PostForm onPostCreated={handlePostCreated} />
      )}

      {/* Posts List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedTag !== 'all' 
                ? 'Try adjusting your search or filters.'
                : 'Be the first to start a conversation!'}
            </p>
            {user && !showPostForm && (
              <button
                onClick={() => setShowPostForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create First Post
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map(post => (
            <PostItem
              key={post.id}
              post={post}
              onPostClick={handlePostClick}
            />
          ))}
        </div>
      )}

      {/* Loading More Indicator */}
      {posts.length > 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">
            Showing {posts.length} post{posts.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default Forum;
