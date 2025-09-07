import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { PlusIcon, SpeakerWaveIcon, FunnelIcon } from '@heroicons/react/24/outline';
import NoticeCard from '../components/NoticeCard';
import NoticeForm from '../components/NoticeForm';
import NoticeDetail from '../components/NoticeDetail';
import RoleGuard from '../components/RoleGuard';
import toast from 'react-hot-toast';

export const Notices = () => {
  const { profile } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);

  const categories = [
    { id: 'all', label: 'All Notices', count: 0 },
    { id: 'exam', label: 'Exams', count: 0 },
    { id: 'class', label: 'Classes', count: 0 },
    { id: 'event', label: 'Events', count: 0 },
    { id: 'general', label: 'General', count: 0 },
  ];

  // Update category counts
  const categoriesWithCounts = categories.map(category => ({
    ...category,
    count: category.id === 'all' ? notices.length : notices.filter(notice => notice.category === category.id).length
  }));

  // Filter notices by category
  const filteredNotices = selectedCategory === 'all' 
    ? notices 
    : notices.filter(notice => notice.category === selectedCategory);

  // Fetch notices with author information
  const fetchNotices = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notices')
        .select(`
          *,
          author:profiles!posted_by(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotices(data || []);
    } catch (error) {
      console.error('Error fetching notices:', error);
      toast.error('Failed to load notices');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create notice
  const handleCreateNotice = async (noticeData) => {
    try {
      const { error } = await supabase
        .from('notices')
        .insert([noticeData]);

      if (error) throw error;

      // Real-time update will handle adding the notice to the list
    } catch (error) {
      console.error('Error creating notice:', error);
      throw error;
    }
  };

  // Update notice
  const handleUpdateNotice = async (noticeData, noticeId) => {
    try {
      const { error } = await supabase
        .from('notices')
        .update(noticeData)
        .eq('id', noticeId);

      if (error) throw error;

      // Real-time update will handle updating the notice in the list
    } catch (error) {
      console.error('Error updating notice:', error);
      throw error;
    }
  };

  // Delete notice
  const handleDeleteNotice = async (noticeId) => {
    try {
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', noticeId);

      if (error) throw error;

      // Real-time update will handle removing the notice from the list
    } catch (error) {
      console.error('Error deleting notice:', error);
      toast.error('Failed to delete notice');
      throw error;
    }
  };

  // Handle form submission
  const handleFormSubmit = async (noticeData, editId) => {
    if (editId) {
      await handleUpdateNotice(noticeData, editId);
    } else {
      await handleCreateNotice(noticeData);
    }
  };

  // Handle edit
  const handleEdit = (notice) => {
    setEditingNotice(notice);
    setShowForm(true);
  };

  // Handle close form
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingNotice(null);
  };

  // Handle view details
  const handleViewDetails = (notice) => {
    setSelectedNotice(notice);
    setShowDetail(true);
  };

  // Handle close detail
  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedNotice(null);
  };

  // Set up real-time subscription
  useEffect(() => {
    // Initial fetch
    fetchNotices();

    // Set up real-time subscription
    const channel = supabase
      .channel('notices')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notices'
        },
        async (payload) => {
          console.log('Real-time notice change:', payload);

          if (payload.eventType === 'INSERT') {
            // Fetch the new notice with author info
            const { data, error } = await supabase
              .from('notices')
              .select(`
                *,
                author:profiles!posted_by(name)
              `)
              .eq('id', payload.new.id)
              .single();

            if (!error && data) {
              setNotices(prev => [data, ...prev]);
              // Show notification only if it's not from the current user
              if (data.posted_by !== profile?.id) {
                toast.success(`New ${data.category} notice: ${data.title}`);
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            // Fetch updated notice with author info
            const { data, error } = await supabase
              .from('notices')
              .select(`
                *,
                author:profiles!posted_by(name)
              `)
              .eq('id', payload.new.id)
              .single();

            if (!error && data) {
              setNotices(prev => prev.map(notice => 
                notice.id === data.id ? data : notice
              ));
            }
          } else if (payload.eventType === 'DELETE') {
            setNotices(prev => prev.filter(notice => notice.id !== payload.old.id));
            // Show notification only if it wasn't deleted by the current user
            if (payload.old.posted_by !== profile?.id) {
              toast.info('A notice has been deleted');
            }
          }
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotices, profile?.id]);

  const canCreateNotice = profile && (profile.role === 'teacher' || profile.role === 'admin');

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SpeakerWaveIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Campus Notices
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Stay updated with important announcements and information
              </p>
            </div>
          </div>

          {/* Create Notice Button */}
          <RoleGuard roles={['teacher', 'admin']} fallback={null}>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Create Notice</span>
            </button>
          </RoleGuard>
        </div>

        {/* Category Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FunnelIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filter by Category</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categoriesWithCounts.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {category.label} ({category.count})
              </button>
            ))}
          </div>
        </div>

        {/* Notices List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading notices...</span>
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <SpeakerWaveIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {selectedCategory === 'all' ? 'No notices yet' : `No ${selectedCategory} notices`}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {selectedCategory === 'all' 
                  ? 'There are no notices to display at the moment.'
                  : `No notices found in the ${selectedCategory} category.`
                }
              </p>
              {canCreateNotice && selectedCategory === 'all' && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Create First Notice
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotices.map((notice) => (
                <NoticeCard
                  key={notice.id}
                  notice={notice}
                  onEdit={handleEdit}
                  onDelete={handleDeleteNotice}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </div>

        {/* Notice Form Modal */}
        <NoticeForm
          isOpen={showForm}
          onClose={handleCloseForm}
          onSubmit={handleFormSubmit}
          editingNotice={editingNotice}
        />

        {/* Notice Detail Modal */}
        <NoticeDetail
          notice={selectedNotice}
          isOpen={showDetail}
          onClose={handleCloseDetail}
          onEdit={handleEdit}
          onDelete={handleDeleteNotice}
        />
      </div>
    </Layout>
  );
};
