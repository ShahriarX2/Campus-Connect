import { useState } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { UserIcon, EnvelopeIcon, AcademicCapIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export const Profile = () => {
  const { user, profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    department: profile?.department || '',
    year: profile?.year || '',
    bio: profile?.bio || '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      // Here you would typically update the profile in Supabase
      // For now, we'll just show a success message
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error(`Failed to update profile : ${error}`);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      department: profile?.department || '',
      year: profile?.year || '',
      bio: profile?.bio || '',
    });
    setIsEditing(false);
  };

  const getInitials = (name) => {
    if (!name) return user?.email?.[0]?.toUpperCase() || 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'teacher':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'student':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Profile
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage your account information and preferences.
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex items-center space-x-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {getInitials(profile?.name)}
                  </span>
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {profile?.name || 'User Profile'}
                  </h2>
                  {profile?.role && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(profile.role)}`}>
                      {profile.role}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {user?.email}
                </p>
                {profile?.department && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {profile.department}
                    {profile.year && ` • ${profile.year}`}
                  </p>
                )}
              </div>

              {/* Edit Button */}
              <div className="flex-shrink-0">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveProfile}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Profile Information
            </h3>
          </div>

          <div className="px-6 py-6 space-y-6">
            {isEditing ? (
              // Edit Form
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Computer Science, Mathematics"
                  />
                </div>

                {profile?.role === 'student' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Year
                    </label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select year</option>
                      <option value="Freshman">Freshman</option>
                      <option value="Sophomore">Sophomore</option>
                      <option value="Junior">Junior</option>
                      <option value="Senior">Senior</option>
                      <option value="Graduate">Graduate</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
            ) : (
              // Display Mode
              <div className="space-y-6">
                <div className="flex items-start space-x-3">
                  <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Full Name</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {profile?.name || 'Not provided'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Email</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Department</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {profile?.department || 'Not provided'}
                    </p>
                  </div>
                </div>

                {profile?.role === 'student' && (
                  <div className="flex items-start space-x-3">
                    <AcademicCapIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Year</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {profile?.year || 'Not provided'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Bio</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {profile?.bio || 'No bio provided yet.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Account Information
            </h3>
          </div>
          
          <div className="px-6 py-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Account Created</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Last Sign In</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Email Verified</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user?.email_confirmed_at ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
