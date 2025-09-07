import * as Sentry from '@sentry/react';

export class AuthSentryUtils {
  // Set up authentication context for Sentry
  static setAuthContext(user, profile, loading) {
    // Update global window variables for beforeSend hook
    if (typeof window !== 'undefined') {
      window.__AUTH_USER__ = user;
      window.__AUTH_PROFILE__ = profile;
      window.__AUTH_LOADING__ = loading;
    }

    // Set Sentry user context
    Sentry.setUser(user ? {
      id: user.id,
      email: user.email,
      username: user.email,
    } : null);

    // Set custom context
    Sentry.setContext('auth', {
      hasUser: !!user,
      hasProfile: !!profile,
      profileRole: profile?.role,
      isLoading: loading,
      timestamp: new Date().toISOString()
    });

    // Set tags for filtering
    Sentry.setTag('auth.status', user ? 'authenticated' : 'anonymous');
    Sentry.setTag('auth.role', profile?.role || 'none');
    Sentry.setTag('auth.loading', loading ? 'true' : 'false');
  }

  // Track authentication events
  static trackAuthEvent(eventName, data = {}) {
    Sentry.addBreadcrumb({
      message: `Auth Event: ${eventName}`,
      category: 'auth',
      level: 'info',
      data: {
        ...data,
        timestamp: Date.now()
      }
    });

    // Also log as custom event for performance tracking
    Sentry.captureMessage(`Authentication: ${eventName}`, {
      level: 'info',
      tags: {
        'auth.event': eventName
      },
      extra: data
    });
  }

  // Track authentication errors
  static trackAuthError(error, context = {}) {
    const errorData = {
      message: error.message || 'Unknown auth error',
      code: error.code,
      details: error.details,
      hint: error.hint,
      ...context
    };

    Sentry.addBreadcrumb({
      message: `Auth Error: ${error.message || 'Unknown'}`,
      category: 'auth.error',
      level: 'error',
      data: errorData
    });

    // Capture as exception if it's a real error object
    if (error instanceof Error) {
      Sentry.captureException(error, {
        tags: {
          'auth.error': 'true'
        },
        extra: errorData
      });
    } else {
      // Capture as message for non-Error objects
      Sentry.captureMessage(`Authentication Error: ${error.message || 'Unknown'}`, {
        level: 'error',
        tags: {
          'auth.error': 'true'
        },
        extra: errorData
      });
    }
  }

  // Track performance issues
  static trackAuthPerformance(operation, duration, success = true) {
    // Use modern Sentry API - startSpan instead of deprecated startTransaction
    try {
      if (Sentry.startSpan) {
        Sentry.startSpan({
          name: `auth.${operation}`,
          op: 'auth',
          attributes: {
            'auth.operation': operation,
            'auth.success': success.toString(),
            'duration': duration
          }
        }, () => {
          // Span is automatically finished
        });
      }
    } catch (error) {
      // Fallback if Sentry API is not available
      console.warn('Sentry performance tracking failed:', error.message);
    }

    // Add breadcrumb (this still works with all Sentry versions)
    Sentry.addBreadcrumb({
      message: `Auth Performance: ${operation} took ${duration}ms`,
      category: 'auth.performance',
      level: success ? 'info' : 'warning',
      data: {
        operation,
        duration,
        success
      }
    });
  }

  // Track loading states
  static trackLoadingState(state, duration = null) {
    Sentry.addBreadcrumb({
      message: `Auth Loading: ${state}`,
      category: 'auth.loading',
      level: 'info',
      data: {
        state,
        duration,
        timestamp: Date.now()
      }
    });

    if (state === 'timeout' || (duration && duration > 10000)) {
      // Track long loading as potential issue
      Sentry.captureMessage('Authentication loading timeout', {
        level: 'warning',
        tags: {
          'auth.loading': 'timeout'
        },
        extra: {
          state,
          duration
        }
      });
    }
  }

  // Start a session for auth debugging
  static startAuthSession() {
    const sessionId = `auth_${Date.now()}`;
    Sentry.setTag('auth.session', sessionId);
    
    this.trackAuthEvent('session_started', { sessionId });
    return sessionId;
  }

  // Debug helper - capture current auth state
  static captureAuthSnapshot(reason = 'debug') {
    const snapshot = {
      reason,
      timestamp: new Date().toISOString(),
      user: window.__AUTH_USER__ ? {
        id: window.__AUTH_USER__.id,
        email: window.__AUTH_USER__.email,
        created_at: window.__AUTH_USER__.created_at
      } : null,
      profile: window.__AUTH_PROFILE__,
      loading: window.__AUTH_LOADING__,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    Sentry.captureMessage('Auth State Snapshot', {
      level: 'debug',
      tags: {
        'auth.snapshot': reason
      },
      extra: snapshot
    });

    return snapshot;
  }
}

// Export individual methods for convenience
export const {
  setAuthContext,
  trackAuthEvent,
  trackAuthError,
  trackAuthPerformance,
  trackLoadingState,
  startAuthSession,
  captureAuthSnapshot
} = AuthSentryUtils;
