import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { PlusIcon, CalendarIcon, ViewColumnsIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import EventCard from '../components/EventCard';
import EventForm from '../components/EventForm';
import AttendeeList from '../components/AttendeeList';
import RoleGuard from '../components/RoleGuard';
import toast from 'react-hot-toast';

export const Events = () => {
  const { profile } = useAuth();
  const [events, setEvents] = useState([]);
  const [userAttendance, setUserAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'calendar'
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showAttendees, setShowAttendees] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Fetch events with attendee counts
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events_with_counts')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user's attendance status for all events
  const fetchUserAttendance = useCallback(async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('event_attendees')
        .select('event_id, status')
        .eq('user_id', profile.id);

      if (error) throw error;

      const attendanceMap = {};
      data?.forEach(({ event_id, status }) => {
        attendanceMap[event_id] = status;
      });
      setUserAttendance(attendanceMap);
    } catch (error) {
      console.error('Error fetching user attendance:', error);
    }
  }, [profile]);

  // Create event
  const handleCreateEvent = async (eventData) => {
    try {
      const { error } = await supabase
        .from('events')
        .insert([eventData]);

      if (error) throw error;

      toast.success('Event created successfully!');
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  };

  // Update event
  const handleUpdateEvent = async (eventData, eventId) => {
    try {
      const { error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', eventId);

      if (error) throw error;

      toast.success('Event updated successfully!');
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast.success('Event deleted successfully!');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
      throw error;
    }
  };

  // Handle attendance change
  const handleAttendanceChange = async (eventId, newStatus) => {
    try {
      const { error } = await supabase.rpc('toggle_event_attendance', {
        event_uuid: eventId,
        user_uuid: profile.id,
        new_status: newStatus
      });

      if (error) throw error;

      // Update local state
      setUserAttendance(prev => ({
        ...prev,
        [eventId]: newStatus === 'not_attending' ? undefined : newStatus
      }));

      const statusText = newStatus === 'not_attending' ? 'removed your attendance' : `marked as ${newStatus}`;
      toast.success(`Successfully ${statusText}!`);
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Failed to update attendance');
      throw error;
    }
  };

  // Handle form submission
  const handleFormSubmit = async (eventData, editId) => {
    if (editId) {
      await handleUpdateEvent(eventData, editId);
    } else {
      await handleCreateEvent(eventData);
    }
  };

  // Handle edit
  const handleEdit = (event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  // Handle close form
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEvent(null);
  };

  // Handle view attendees
  const handleViewAttendees = (event) => {
    setSelectedEvent(event);
    setShowAttendees(true);
  };

  // Handle close attendees
  const handleCloseAttendees = () => {
    setShowAttendees(false);
    setSelectedEvent(null);
  };

  // Filter events based on active tab
  const getFilteredEvents = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    return events.filter(event => {
      const eventDate = new Date(`${event.event_date}T${event.event_time}`);
      
      switch (activeTab) {
        case 'upcoming':
          return eventDate > now;
        case 'today':
          return event.event_date === today;
        case 'past':
          return eventDate < now;
        case 'my_events':
          return userAttendance[event.id] !== undefined;
        default:
          return true;
      }
    });
  };

  const filteredEvents = getFilteredEvents();

  // Calculate tab counts
  const getTabCounts = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    return {
      upcoming: events.filter(e => new Date(`${e.event_date}T${e.event_time}`) > now).length,
      today: events.filter(e => e.event_date === today).length,
      past: events.filter(e => new Date(`${e.event_date}T${e.event_time}`) < now).length,
      my_events: events.filter(e => userAttendance[e.id] !== undefined).length,
      all: events.length
    };
  };

  const tabCounts = getTabCounts();

  const tabs = [
    { id: 'upcoming', label: 'Upcoming', count: tabCounts.upcoming },
    { id: 'today', label: 'Today', count: tabCounts.today },
    { id: 'past', label: 'Past', count: tabCounts.past },
    { id: 'my_events', label: 'My Events', count: tabCounts.my_events },
    { id: 'all', label: 'All Events', count: tabCounts.all },
  ];

  // Set up real-time subscriptions
  useEffect(() => {
    fetchEvents();
    fetchUserAttendance();

    // Set up real-time subscription for events
    const eventsChannel = supabase
      .channel('events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        () => {
          console.log('Real-time event change detected');
          fetchEvents();
        }
      )
      .subscribe();

    // Set up real-time subscription for event_attendees
    const attendeesChannel = supabase
      .channel('event_attendees')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_attendees'
        },
        () => {
          console.log('Real-time attendee change detected');
          fetchEvents();
          fetchUserAttendance();
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(attendeesChannel);
    };
  }, [fetchEvents, fetchUserAttendance]);

  const canCreateEvent = profile && (profile.role === 'teacher' || profile.role === 'admin');

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Campus Events
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Discover and participate in campus activities and events
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                title="Grid View"
              >
                <ViewColumnsIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  viewMode === 'calendar'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                title="Calendar View"
              >
                <ListBulletIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Create Event Button */}
            <RoleGuard roles={['teacher', 'admin']} fallback={null}>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Create Event</span>
              </button>
            </RoleGuard>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{tab.label}</span>
                <span className={`${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                } inline-block px-2 py-0.5 text-xs font-medium rounded-full`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading events...</span>
          </div>
        ) : (
          <>
            {/* Events Display */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEdit={handleEdit}
                    onDelete={handleDeleteEvent}
                    onAttendanceChange={handleAttendanceChange}
                    onViewAttendees={handleViewAttendees}
                    userStatus={userAttendance[event.id] || 'not_attending'}
                  />
                ))}
              </div>
            ) : (
              /* Simple Calendar/List View */
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Events Calendar
                  </h3>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredEvents.map((event) => {
                    const eventDate = new Date(`${event.event_date}T${event.event_time}`);
                    const isToday = event.event_date === new Date().toISOString().split('T')[0];
                    const isPast = eventDate < new Date();
                    
                    return (
                      <div key={event.id} className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 ${
                        isToday ? 'bg-orange-50 dark:bg-orange-900/10' : ''
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h4 className={`text-lg font-medium ${
                                isPast ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                              }`}>
                                {event.title}
                              </h4>
                              {isToday && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300 text-xs font-medium rounded-full">
                                  Today
                                </span>
                              )}
                              {userAttendance[event.id] && (
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  userAttendance[event.id] === 'going'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                                }`}>
                                  {userAttendance[event.id] === 'going' ? 'Going' : 'Interested'}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {eventDate.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })} at {eventDate.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              📍 {event.location}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {event.total_attendees || 0} attending
                            </p>
                            <button
                              onClick={() => handleViewAttendees(event)}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                            >
                              View attendees
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredEvents.length === 0 && (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No {activeTab === 'all' ? '' : activeTab.replace('_', ' ')} events
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {activeTab === 'upcoming' 
                    ? "There are no upcoming events at the moment." 
                    : activeTab === 'my_events'
                    ? "You haven't signed up for any events yet."
                    : `No ${activeTab.replace('_', ' ')} events found.`}
                </p>
                {canCreateEvent && activeTab === 'upcoming' && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                  >
                    Create First Event
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Event Form Modal */}
        <EventForm
          isOpen={showForm}
          onClose={handleCloseForm}
          onSubmit={handleFormSubmit}
          editingEvent={editingEvent}
        />

        {/* Attendee List Modal */}
        <AttendeeList
          isOpen={showAttendees}
          onClose={handleCloseAttendees}
          eventId={selectedEvent?.id}
          eventTitle={selectedEvent?.title}
        />
      </div>
    </Layout>
  );
};
