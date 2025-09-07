import { useState, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  XMarkIcon, 
  UserGroupIcon, 
  CheckCircleIcon, 
  HeartIcon,
  UserIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { supabase } from '../lib/supabase';
import PropTypes from 'prop-types';

const AttendeeList = ({ isOpen, onClose, eventId, eventTitle }) => {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'going', 'interested'

  // Fetch attendees when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAttendees();
    }
  }, [isOpen, fetchAttendees]);

  // Fetch attendees with profile information
  const fetchAttendees = useCallback(async () => {
    if (!eventId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('event_attendees')
        .select(`
          *,
          user:profiles!user_id(
            id,
            name,
            email,
            role,
            avatar_url
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAttendees(data || []);
    } catch (error) {
      console.error('Error fetching attendees:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // Filter attendees based on status
  const filteredAttendees = filter === 'all' 
    ? attendees 
    : attendees.filter(attendee => attendee.status === filter);

  // Get attendee counts
  const getAttendeeCounts = () => {
    const goingCount = attendees.filter(a => a.status === 'going').length;
    const interestedCount = attendees.filter(a => a.status === 'interested').length;
    return { goingCount, interestedCount, totalCount: attendees.length };
  };

  const { goingCount, interestedCount, totalCount } = getAttendeeCounts();

  // Get status badge
  const getStatusBadge = (status) => {
    if (status === 'going') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
          <CheckCircleIcon className="h-3 w-3" />
          <span>Going</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
          <HeartSolidIcon className="h-3 w-3" />
          <span>Interested</span>
        </span>
      );
    }
  };

  // Get role badge
  const getRoleBadge = (role) => {
    const roleConfig = {
      student: {
        icon: AcademicCapIcon,
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
        label: 'Student'
      },
      teacher: {
        icon: UserIcon,
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
        label: 'Teacher'
      },
      admin: {
        icon: UserIcon,
        color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
        label: 'Admin'
      }
    };

    const config = roleConfig[role] || roleConfig.student;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="h-3 w-3" />
        <span>{config.label}</span>
      </span>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get avatar or initials
  const getAvatarDisplay = (user) => {
    if (user.avatar_url) {
      return (
        <img
          src={user.avatar_url}
          alt={user.name}
          className="h-10 w-10 rounded-full object-cover"
        />
      );
    } else {
      const initials = user.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : user.email ? user.email[0].toUpperCase() : '?';
      
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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Event Attendees
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {eventTitle}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors duration-200"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Summary Stats */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {goingCount}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Going</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {interestedCount}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Interested</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {totalCount}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
                    </div>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-1">
                    {[
                      { id: 'all', label: 'All', count: totalCount },
                      { id: 'going', label: 'Going', count: goingCount, icon: CheckCircleIcon },
                      { id: 'interested', label: 'Interested', count: interestedCount, icon: HeartIcon }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                          filter === tab.id
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        {tab.icon && <tab.icon className="h-4 w-4" />}
                        <span>{tab.label}</span>
                        <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Attendees List */}
                <div className="p-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">Loading attendees...</span>
                    </div>
                  ) : filteredAttendees.length === 0 ? (
                    <div className="text-center py-8">
                      <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {filter === 'all' ? 'No attendees yet' : `No ${filter} attendees`}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        {filter === 'all' 
                          ? 'Be the first to show interest in this event!'
                          : `No one has marked themselves as ${filter} yet.`
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredAttendees.map((attendee) => (
                        <div
                          key={attendee.id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                              {getAvatarDisplay(attendee.user)}
                            </div>
                            
                            {/* User Info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {attendee.user.name || 'Unknown User'}
                                </p>
                                {getRoleBadge(attendee.user.role)}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {attendee.user.email}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Responded on {formatDate(attendee.created_at)}
                              </p>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="flex-shrink-0">
                            {getStatusBadge(attendee.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {filteredAttendees.length} of {totalCount} attendees shown
                    </p>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
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

AttendeeList.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  eventId: PropTypes.string,
  eventTitle: PropTypes.string,
};

export default AttendeeList;
