import { useState } from 'react';
import { Layout } from '../components/Layout';
import { PlusIcon, CalendarIcon, MapPinIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../context/ThemeContext';
import PropTypes from 'prop-types';

const EventCard = ({ event }) => {
  const { isDark } = useTheme();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {event.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {event.description}
          </p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          event.status === 'upcoming' 
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
            : event.status === 'ongoing'
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {event.status}
        </span>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <CalendarIcon className="h-4 w-4 mr-2" />
          {event.date} at {event.time}
        </div>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <MapPinIcon className="h-4 w-4 mr-2" />
          {event.location}
        </div>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <UsersIcon className="h-4 w-4 mr-2" />
          {event.attendees} attendees
        </div>
      </div>
      
      <div className="flex space-x-2">
        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200">
          View Details
        </button>
        <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium transition-colors duration-200">
          Share
        </button>
      </div>
    </div>
  );
};

EventCard.propTypes = {
  event: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    time: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    attendees: PropTypes.number.isRequired,
  }).isRequired,
};

export const Events = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  
  // Sample events data
  const events = [
    {
      id: 1,
      title: "Computer Science Workshop",
      description: "Learn the fundamentals of web development with React and Node.js",
      status: "upcoming",
      date: "Dec 15, 2024",
      time: "2:00 PM",
      location: "Tech Lab 101",
      attendees: 45
    },
    {
      id: 2,
      title: "Student Council Meeting",
      description: "Monthly meeting to discuss campus improvements and student concerns",
      status: "ongoing",
      date: "Dec 10, 2024",
      time: "10:00 AM",
      location: "Conference Room A",
      attendees: 12
    },
    {
      id: 3,
      title: "Career Fair 2024",
      description: "Meet potential employers and learn about internship opportunities",
      status: "upcoming",
      date: "Dec 20, 2024",
      time: "9:00 AM",
      location: "Main Auditorium",
      attendees: 150
    },
    {
      id: 4,
      title: "Study Group - Mathematics",
      description: "Group study session for upcoming calculus exam",
      status: "completed",
      date: "Dec 5, 2024",
      time: "6:00 PM",
      location: "Library Room 204",
      attendees: 8
    }
  ];

  const filteredEvents = events.filter(event => {
    if (activeTab === 'all') return true;
    return event.status === activeTab;
  });

  const tabs = [
    { id: 'upcoming', label: 'Upcoming', count: events.filter(e => e.status === 'upcoming').length },
    { id: 'ongoing', label: 'Ongoing', count: events.filter(e => e.status === 'ongoing').length },
    { id: 'completed', label: 'Completed', count: events.filter(e => e.status === 'completed').length },
    { id: 'all', label: 'All Events', count: events.length },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Campus Events
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Discover and participate in campus activities and events
            </p>
          </div>
          <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
            <PlusIcon className="h-5 w-5" />
            <span>Create Event</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
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

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {/* Empty State */}
        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No {activeTab} events
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {activeTab === 'upcoming' 
                ? "There are no upcoming events at the moment." 
                : `No ${activeTab} events found.`}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};
