import { useAuth } from '../context/AuthContext';
import PropTypes from 'prop-types';

const RoleGuard = ({ roles, children, fallback }) => {
  const { user, profile, loading } = useAuth();

  // Show loading spinner while checking authentication and profile
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // User not authenticated
  if (!user) {
    return fallback || (
      <div className="text-center p-8">
        <p className="text-gray-600 dark:text-gray-400">Please log in to access this feature.</p>
      </div>
    );
  }

  // Profile not loaded or no role
  if (!profile || !profile.role) {
    return fallback || (
      <div className="text-center p-8">
        <p className="text-gray-600 dark:text-gray-400">Unable to verify your permissions. Please contact support.</p>
      </div>
    );
  }

  // Check if user's role is in the allowed roles
  const hasPermission = roles.includes(profile.role);

  if (!hasPermission) {
    return fallback || (
      <div className="text-center p-8">
        <div className="max-w-md mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
              Access Denied
            </h3>
            <p className="text-sm text-red-600 dark:text-red-300">
              You don't have permission to access this feature. This area is restricted to {roles.join(', ')} roles.
            </p>
            <p className="text-xs text-red-500 dark:text-red-400 mt-2">
              Your current role: <span className="font-medium">{profile.role}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // User has permission, render the protected component
  return children;
};

RoleGuard.propTypes = {
  roles: PropTypes.arrayOf(PropTypes.oneOf(['student', 'teacher', 'admin'])).isRequired,
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
};

export default RoleGuard;
