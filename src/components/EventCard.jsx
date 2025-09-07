import { useState } from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  UserIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  CheckCircleIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, CheckCircleIcon as CheckSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import PropTypes from 'prop-types';

const EventCard = ({ 
  event, 
  onEdit, 
  onDelete, 
  onAttendanceChange,
  onViewAttendees,
  userStatus = 'not_attending' 
}) => {
  const { profile } = useAuth();
  const [isUpdatingAttendance, setIsUpdatingAttendance] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if user can modify this event
  const canModify = () => {
    return profile && 
           (profile.role === 'admin' || 
           (profile.role === 'teacher' && event.created_by === profile.id));
  };

  // Handle attendance change
  const handleAttendanceChange = async (newStatus) => {
    setIsUpdatingAttendance(true);
    try {
      await onAttendanceChange(event.id, newStatus);
    } finally {
      setIsUpdatingAttendance(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      setIsDeleting(true);
      try {
        await onDelete(event.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Format date and time
  const formatEventDate = () => {
    const date = new Date(`${event.event_date}T${event.event_time}`);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatEventTime = () => {
    const [hours, minutes] = event.event_time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Check if event is upcoming
  const isUpcoming = () => {
    const eventDateTime = new Date(`${event.event_date}T${event.event_time}`);
    return eventDateTime > new Date();
  };

  // Check if event is today
  const isToday = () => {
    const today = new Date().toISOString().split('T')[0];
    return event.event_date === today;
  };

  // Check if event is past
  const isPast = () => {
    const eventDateTime = new Date(`${event.event_date}T${event.event_time}`);
    return eventDateTime < new Date();
  };

  // Get time until event
  const getTimeUntilEvent = () => {
    const eventDateTime = new Date(`${event.event_date}T${event.event_time}`);
    const now = new Date();
    const diff = eventDateTime - now;
    
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `in ${days} day${days === 1 ? '' : 's'}`;
    } else if (hours > 0) {
      return `in ${hours} hour${hours === 1 ? '' : 's'}`;
    } else {
      return 'starting soon';
    }
  };

  // Get attendance button style
  const getAttendanceButtonStyle = (status) => {
    const baseClasses = 'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
    
    if (userStatus === status) {
      if (status === 'going') {
        return `${baseClasses} bg-green-600 text-white hover:bg-green-700`;
      } else {
        return `${baseClasses} bg-yellow-600 text-white hover:bg-yellow-700`;
      }
    } else {
      if (status === 'going') {
        return `${baseClasses} border border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20`;
      } else {
        return `${baseClasses} border border-yellow-600 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20`;
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Header with event status indicator */}
      <div className={`h-2 ${isToday() ? 'bg-orange-500' : isUpcoming() ? 'bg-green-500' : 'bg-gray-400'}`} />
      
      <div className="p-6">
        {/* Event Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {event.title}
            </h3>
            
            {/* Date and Time */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <CalendarIcon className="h-4 w-4" />
                <span>{formatEventDate()}</span>
                {getTimeUntilEvent() && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isToday() 
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                  }`}>
                    {getTimeUntilEvent()}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <ClockIcon className="h-4 w-4" />
                <span>{formatEventTime()}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <MapPinIcon className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons for Organizers */}
          {canModify() && (
            <div className="flex space-x-2 ml-4">
              <button
                onClick={() => onEdit(event)}
                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200"
                title="Edit event"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete event"
              >
                {isDeleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent"></div>
                ) : (
                  <TrashIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Event Description */}
        <div className="mb-4">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {event.description.length > 150
              ? `${event.description.substring(0, 150)}...`
              : event.description}
          </p>
        </div>

        {/* Creator Info */}
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <UserIcon className="h-4 w-4" />
          <span>Organized by {event.creator_name || 'Unknown'}</span>
        </div>

        {/* Attendee Counts */}
        <div className="mb-4">
          <button
            onClick={() => onViewAttendees(event)}
            className="flex items-center space-x-4 w-full p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <div className="flex items-center space-x-2">
              <UserGroupIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {event.total_attendees || 0} attending
              </span>
            </div>
            
            <div className="flex space-x-4 flex-1">
              <div className="flex items-center space-x-1">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600 dark:text-green-400">
                  {event.going_count || 0} going
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <HeartSolidIcon className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-600 dark:text-yellow-400">
                  {event.interested_count || 0} interested
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Attendance Actions for Students */}
        {profile && profile.role === 'student' && !isPast() && (
          <div className="flex space-x-3">
            <button
              onClick={() => handleAttendanceChange(userStatus === 'going' ? 'not_attending' : 'going')}
              disabled={isUpdatingAttendance}
              className={getAttendanceButtonStyle('going')}
            >
              {isUpdatingAttendance ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
              ) : (
                <>
                  {userStatus === 'going' ? <CheckSolidIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                  <span>{userStatus === 'going' ? 'Going' : 'Mark as Going'}</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleAttendanceChange(userStatus === 'interested' ? 'not_attending' : 'interested')}
              disabled={isUpdatingAttendance}
              className={getAttendanceButtonStyle('interested')}
            >
              {isUpdatingAttendance ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
              ) : (
                <>
                  {userStatus === 'interested' ? <HeartSolidIcon className="h-4 w-4" /> : <HeartIcon className="h-4 w-4" />}
                  <span>{userStatus === 'interested' ? 'Interested' : 'Mark as Interested'}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Past Event Indicator */}
        {isPast() && (
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              This event has ended
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

EventCard.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    event_date: PropTypes.string.isRequired,
    event_time: PropTypes.string.isRequired,
    created_by: PropTypes.string.isRequired,
    creator_name: PropTypes.string,
    going_count: PropTypes.number,
    interested_count: PropTypes.number,
    total_attendees: PropTypes.number,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onAttendanceChange: PropTypes.func.isRequired,
  onViewAttendees: PropTypes.func.isRequired,
  userStatus: PropTypes.oneOf(['not_attending', 'going', 'interested']),
};

export default EventCard;
