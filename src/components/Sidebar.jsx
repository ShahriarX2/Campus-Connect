import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  UsersIcon, 
  CalendarIcon,
  BookOpenIcon,
  CogIcon,
  ChatBubbleLeftIcon,
  SpeakerWaveIcon,
  ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Students', href: '/students', icon: UsersIcon },
  { name: 'Events', href: '/events', icon: CalendarIcon },
  { name: 'Messages', href: '/messages', icon: ChatBubbleLeftIcon },
  { name: 'Forum', href: '/forum', icon: ChatBubbleLeftEllipsisIcon },
  { name: 'Notices', href: '/notices', icon: SpeakerWaveIcon },
  { name: 'Resources', href: '/resources', icon: BookOpenIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
];

export const Sidebar = ({ isOpen }) => {
  const location = useLocation();

  return (
    <div className={`${
      isOpen ? 'w-64' : 'w-16'
    } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col`}>
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">CC</span>
          </div>
          {isOpen && (
            <span className="font-semibold text-gray-900 dark:text-white">
              Campus Connect
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-r-2 border-blue-700 dark:border-blue-300'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150`}
              title={!isOpen ? item.name : undefined}
            >
              <item.icon
                className={`${
                  isActive
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-400 dark:text-gray-300 group-hover:text-gray-500 dark:group-hover:text-gray-200'
                } mr-3 flex-shrink-0 h-6 w-6`}
                aria-hidden="true"
              />
              {isOpen && item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
};
