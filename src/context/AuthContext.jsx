import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import PropTypes from 'prop-types';
import { AuthSentryUtils } from '../utils/sentryAuth';

const AuthContext = createContext({});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const initializingRef = useRef(false);
  
  // Start Sentry auth session
  useState(() => AuthSentryUtils.startAuthSession());
  
  // Track loading state changes for Sentry
  useEffect(() => {
    AuthSentryUtils.setAuthContext(user, profile, loading);
    AuthSentryUtils.trackLoadingState(loading ? 'started' : 'completed');
  }, [user, profile, loading]);
  
  // Note: Emergency timeout removed - using safety timeout in auth initialization instead

  // Create user profile in profiles table
  const createUserProfile = async (userId, userData = {}) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: userData.name || '',
          role: userData.role || 'student',
          department: userData.department || '',
          year: userData.year || '',
          bio: userData.bio || '',
          avatar_url: null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error creating profile:', error);
      return null;
    }
  };

  // Fetch user profile from profiles table
  const fetchUserProfile = useCallback(async (userId) => {
    const startTime = Date.now();
    AuthSentryUtils.trackAuthEvent('profile_fetch_started', { userId });
    
    if (!userId) {
      setProfile(null);
      AuthSentryUtils.trackAuthEvent('profile_fetch_skipped', { reason: 'no_user_id' });
      return;
    }

    try {
      // Increase timeout to 5 seconds and improve error handling
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      );
      
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      const result = await Promise.race([fetchPromise, timeoutPromise]);
      const duration = Date.now() - startTime;

      if (result.error || !result.data) {
        console.warn('Profile fetch failed, using fallback:', result.error?.message || 'No data');
        AuthSentryUtils.trackAuthError(result.error || new Error('No profile data'), { 
          userId, 
          duration,
          operation: 'profile_fetch'
        });
        AuthSentryUtils.trackAuthPerformance('profile_fetch', duration, false);
        createFallbackProfile(userId); // Don't await to prevent blocking
      } else {
        setProfile(result.data);
        AuthSentryUtils.trackAuthEvent('profile_fetch_success', { userId, role: result.data.role, duration });
        AuthSentryUtils.trackAuthPerformance('profile_fetch', duration, true);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      // Only log as warning if it's actually a timeout or network error
      if (error.message.includes('timeout') || error.message.includes('network')) {
        console.warn('Profile fetch error:', error.message);
        AuthSentryUtils.trackAuthError(error, { 
          userId, 
          duration,
          operation: 'profile_fetch_exception'
        });
        AuthSentryUtils.trackAuthPerformance('profile_fetch', duration, false);
        createFallbackProfile(userId); // Don't await to prevent blocking
      } else {
        // For other errors, just create fallback without logging
        createFallbackProfile(userId);
      }
    }
  }, []); // Empty dependencies since it uses setProfile internally

  // Create fallback profile from user metadata
  const createFallbackProfile = (userId) => {
    // Create a minimal profile immediately to prevent loading issues
    const minimalProfile = {
      id: userId,
      name: '',
      role: 'student',
      department: '',
      year: '',
      bio: '',
      avatar_url: null,
      created_at: new Date().toISOString()
    };
    setProfile(minimalProfile);
    
    // Try to enhance with user metadata asynchronously (don't block)
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      if (currentUser?.user_metadata) {
        const enhancedProfile = {
          ...minimalProfile,
          name: currentUser.user_metadata.name || '',
          role: currentUser.user_metadata.role || 'student',
          department: currentUser.user_metadata.department || '',
          year: currentUser.user_metadata.year || '',
          created_at: currentUser.created_at || minimalProfile.created_at
        };
        setProfile(enhancedProfile);
      }
    }).catch(error => {
      console.warn('Could not enhance fallback profile:', error.message);
    });
  };

  useEffect(() => {
    // Set up automatic token refresh (refresh every 1.5 hours for 2-hour expiry)
    const setupTokenRefresh = () => {
      const interval = setInterval(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { error } = await supabase.auth.refreshSession();
          if (error) {
            console.error('Token refresh failed:', error);
          } else {
            console.log('Token refreshed successfully');
          }
        }
      }, 90 * 60 * 1000); // Refresh every 90 minutes (1.5 hours)
      
      return interval;
    };

    const refreshInterval = setupTokenRefresh();

    // Refresh token when user returns to the app
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Check if token is close to expiring (less than 30 minutes left)
          const expiresAt = session.expires_at * 1000; // Convert to milliseconds
          const now = Date.now();
          const timeUntilExpiry = expiresAt - now;
          const thirtyMinutes = 30 * 60 * 1000;
          
          if (timeUntilExpiry < thirtyMinutes) {
            console.log('Token expiring soon, refreshing...');
            await supabase.auth.refreshSession();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Safety timeout variable to be accessible in multiple scopes
    let safetyTimeoutRef = null;

    // Get initial session
    const getInitialSession = async () => {
      // Prevent duplicate initialization in React strict mode
      if (initializingRef.current) {
        console.log('Initial session already in progress, skipping...');
        return;
      }
      
      initializingRef.current = true;
      const startTime = Date.now();
      console.log('Getting initial session...');
      AuthSentryUtils.trackAuthEvent('initial_session_started');
      
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        const sessionCheckDuration = Date.now() - startTime;
        
        console.log('Initial session result:', !!initialSession);
        AuthSentryUtils.trackAuthEvent('initial_session_result', { 
          hasSession: !!initialSession,
          hasUser: !!initialSession?.user,
          duration: sessionCheckDuration
        });
        
        setUser(initialSession?.user || null);
        
        if (initialSession?.user) {
          console.log('User found, fetching profile...');
          AuthSentryUtils.trackAuthEvent('initial_session_user_found', { 
            userId: initialSession.user.id,
            email: initialSession.user.email
          });
          fetchUserProfile(initialSession.user.id); // Don't await to prevent blocking
        } else {
          console.log('No user found');
          AuthSentryUtils.trackAuthEvent('initial_session_no_user');
          setProfile(null);
        }
        
        AuthSentryUtils.trackAuthPerformance('initial_session', sessionCheckDuration, true);
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error('Error getting initial session:', error);
        AuthSentryUtils.trackAuthError(error, { 
          operation: 'initial_session',
          duration
        });
        AuthSentryUtils.trackAuthPerformance('initial_session', duration, false);
        setUser(null);
        setProfile(null);
      }
      
      const totalDuration = Date.now() - startTime;
      console.log('Setting loading to false');
      AuthSentryUtils.trackAuthEvent('initial_session_completed', { duration: totalDuration });
      setLoading(false);
      
      // Clear safety timeout since initialization completed successfully
      if (safetyTimeoutRef) {
        clearTimeout(safetyTimeoutRef);
        safetyTimeoutRef = null;
      }
      
      // Reset initialization flag
      setTimeout(() => {
        initializingRef.current = false;
      }, 1000);
    };

    // Start initial session loading with a safety timeout
    getInitialSession();
    
    // Safety timeout in case getInitialSession doesn't complete
    safetyTimeoutRef = setTimeout(() => {
      // Only trigger if we're still in loading state and haven't completed initialization
      if (loading && !user && !profile) {
        console.warn('Safety timeout: forcing loading to false - initialization may have stalled');
        setLoading(false);
      }
    }, 8000);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, 'Session:', !!session);
        
        // Don't set loading on INITIAL_SESSION to avoid resetting the loading state
        if (event !== 'INITIAL_SESSION') {
          setUser(session?.user || null);
          
          if (session?.user) {
            console.log('Fetching profile for auth state change...');
            await fetchUserProfile(session.user.id);
          } else {
            setProfile(null);
          }
          
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
      if (safetyTimeoutRef) clearTimeout(safetyTimeoutRef);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependencies intentionally omitted to prevent infinite loops

  // Sign up with email and password
  const signUp = async (email, password, metadata = {}) => {
    const startTime = Date.now();
    AuthSentryUtils.trackAuthEvent('sign_up_started', { email, role: metadata.role });
    
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata, // Additional user metadata
        },
      });

      const duration = Date.now() - startTime;
      
      if (error) {
        AuthSentryUtils.trackAuthError(error, { 
          operation: 'sign_up', 
          email, 
          duration 
        });
        throw error;
      }
      
      // Create profile record if user was created successfully
      if (data.user) {
        try {
          // Create profile immediately after user creation
          const profileData = await createUserProfile(data.user.id, metadata);
          if (profileData) {
            console.log('Profile created successfully:', profileData.id);
            AuthSentryUtils.trackAuthEvent('profile_created_on_signup', {
              userId: data.user.id,
              role: metadata.role || 'student'
            });
          }
        } catch (profileError) {
          console.warn('Failed to create profile on signup:', profileError.message);
          // Don't fail the signup if profile creation fails
        }
        
        if (!data.user.email_confirmed_at) {
          console.log('Account created successfully, please verify email');
          AuthSentryUtils.trackAuthEvent('sign_up_success_pending_confirmation', { 
            userId: data.user.id,
            email,
            duration 
          });
        } else {
          AuthSentryUtils.trackAuthEvent('sign_up_success', { 
            userId: data.user?.id,
            email,
            duration 
          });
        }
      }
      
      AuthSentryUtils.trackAuthPerformance('sign_up', duration, true);
      return { data, error: null };
    } catch (error) {
      const duration = Date.now() - startTime;
      AuthSentryUtils.trackAuthError(error, { operation: 'sign_up', email, duration });
      AuthSentryUtils.trackAuthPerformance('sign_up', duration, false);
      return { data: null, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    const startTime = Date.now();
    AuthSentryUtils.trackAuthEvent('sign_in_started', { email });
    
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      const duration = Date.now() - startTime;
      
      if (error) {
        AuthSentryUtils.trackAuthError(error, { 
          operation: 'sign_in', 
          email, 
          duration 
        });
        AuthSentryUtils.trackAuthPerformance('sign_in', duration, false);
        throw error;
      }
      
      AuthSentryUtils.trackAuthEvent('sign_in_success', { 
        userId: data.user?.id,
        email,
        duration 
      });
      AuthSentryUtils.trackAuthPerformance('sign_in', duration, true);
      
      return { data, error: null };
    } catch (error) {
      const duration = Date.now() - startTime;
      AuthSentryUtils.trackAuthError(error, { operation: 'sign_in', email, duration });
      AuthSentryUtils.trackAuthPerformance('sign_in', duration, false);
      return { data: null, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
      return { error: null };
    } catch (error) {
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Update profile data
  const updateProfile = async (profileData) => {
    if (!user?.id) {
      throw new Error('No authenticated user');
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      AuthSentryUtils.trackAuthEvent('profile_updated', { 
        userId: user.id, 
        fields: Object.keys(profileData) 
      });
      return { data, error: null };
    } catch (error) {
      AuthSentryUtils.trackAuthError(error, { 
        operation: 'profile_update', 
        userId: user.id 
      });
      return { data: null, error: error.message };
    }
  };

  // Upload avatar to Supabase Storage
  const uploadAvatar = async (file) => {
    if (!user?.id) {
      throw new Error('No authenticated user');
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      AuthSentryUtils.trackAuthEvent('avatar_uploaded', { 
        userId: user.id, 
        fileName 
      });
      return { data: publicUrl, error: null };
    } catch (error) {
      AuthSentryUtils.trackAuthError(error, { 
        operation: 'avatar_upload', 
        userId: user.id 
      });
      return { data: null, error: error.message };
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    fetchUserProfile,
    updateProfile,
    uploadAvatar,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
