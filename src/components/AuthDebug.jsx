import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { AuthSentryUtils } from '../utils/sentryAuth';

const AuthDebug = () => {
  const { user, profile, loading } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [sentrySnapshot, setSentrySnapshot] = useState(null);

  // Capture Sentry snapshot when auth state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const snapshot = {
        windowUser: !!window.__AUTH_USER__,
        windowProfile: !!window.__AUTH_PROFILE__,
        windowLoading: !!window.__AUTH_LOADING__,
        localUser: !!user,
        localProfile: !!profile,
        localLoading: loading
      };
      setSentrySnapshot(snapshot);
    }
  }, [user, profile, loading]);

  const handleCaptureSentrySnapshot = () => {
    AuthSentryUtils.captureAuthSnapshot('manual_debug');
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-3 rounded-lg text-sm font-mono z-50 max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold">Auth Debug</h3>
        <div className="flex gap-1">
          <button 
            onClick={handleCaptureSentrySnapshot}
            className="px-2 py-1 bg-purple-600 text-xs rounded hover:bg-purple-700"
            title="Capture Sentry Snapshot"
          >
            📸
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2 py-1 bg-gray-600 text-xs rounded hover:bg-gray-700"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>
      
      <div className="space-y-1">
        <div>Loading: <span className={loading ? 'text-red-400' : 'text-green-400'}>{loading.toString()}</span></div>
        <div>User: <span className={user ? 'text-green-400' : 'text-red-400'}>{user ? '✓' : '✗'}</span></div>
        <div>Profile: <span className={profile ? 'text-green-400' : 'text-red-400'}>{profile ? '✓' : '✗'}</span></div>
        
        {user && (
          <div className="text-xs text-gray-300">
            Email: {user.email}
          </div>
        )}
        {profile && (
          <div className="text-xs text-gray-300">
            Role: {profile.role}
          </div>
        )}
        
        {isExpanded && sentrySnapshot && (
          <div className="border-t border-gray-600 pt-2 mt-2">
            <div className="text-xs text-purple-300 font-bold mb-1">Sentry State:</div>
            <div className="text-xs space-y-1">
              <div>Win User: <span className={sentrySnapshot.windowUser ? 'text-green-400' : 'text-red-400'}>
                {sentrySnapshot.windowUser.toString()}
              </span></div>
              <div>Win Profile: <span className={sentrySnapshot.windowProfile ? 'text-green-400' : 'text-red-400'}>
                {sentrySnapshot.windowProfile.toString()}
              </span></div>
              <div>Win Loading: <span className={sentrySnapshot.windowLoading ? 'text-red-400' : 'text-green-400'}>
                {sentrySnapshot.windowLoading.toString()}
              </span></div>
              <div className="text-xs text-gray-400">Match: {JSON.stringify({
                u: sentrySnapshot.windowUser === sentrySnapshot.localUser,
                p: sentrySnapshot.windowProfile === sentrySnapshot.localProfile,
                l: sentrySnapshot.windowLoading === sentrySnapshot.localLoading
              })}</div>
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-400 pt-1">
          {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default AuthDebug;
