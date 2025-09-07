import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import { AuthSentryUtils } from '../utils/sentryAuth';

const DetailedDebugLog = () => {
  const { user, profile, loading } = useAuth();
  const [logs, setLogs] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const logsRef = useRef(null);
  const lastLogTimeRef = useRef(0);
  const logCountRef = useRef(0);
  const logIdCounter = useRef(0);
  const lastAuthStateRef = useRef('');

  // Function to add log entry - wrapped in useCallback to prevent infinite loops
  const addLog = useCallback((type, message, data = {}) => {
    const now = Date.now();
    
    // Prevent rapid-fire logging that could cause infinite loops
    if (now - lastLogTimeRef.current < 100) { // Less than 100ms since last log
      logCountRef.current++;
      if (logCountRef.current > 10) { // More than 10 logs in quick succession
        console.warn('DetailedDebugLog: Rapid logging detected, throttling to prevent infinite loop');
        return;
      }
    } else {
      logCountRef.current = 0; // Reset counter if enough time has passed
    }
    
    lastLogTimeRef.current = now;
    
    // Create unique ID by combining timestamp with incremental counter
    logIdCounter.current += 1;
    const uniqueId = `${now}_${logIdCounter.current}`;
    
    const logEntry = {
      id: uniqueId,
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString(),
      type,
      message,
      data: JSON.stringify(data, null, 2),
      authState: {
        hasUser: !!user,
        hasProfile: !!profile,
        isLoading: loading,
        userEmail: user?.email,
        profileRole: profile?.role
      }
    };

    setLogs(prev => [...prev.slice(-49), logEntry]); // Keep last 50 logs
  }, [user, profile, loading]);

  // Monitor auth state changes (with debouncing to prevent spam)
  useEffect(() => {
    const currentState = JSON.stringify({
      hasUser: !!user,
      hasProfile: !!profile,
      loading,
      userEmail: user?.email,
      profileRole: profile?.role
    });
    
    // Only log if state actually changed
    if (currentState !== lastAuthStateRef.current) {
      lastAuthStateRef.current = currentState;
      addLog('state', 'Auth state changed', {
        user: user ? { id: user.id, email: user.email } : null,
        profile: profile ? { role: profile.role, name: profile.name } : null,
        loading
      });
    }
  }, [user, profile, loading, addLog]);

  // Monitor console errors
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    console.error = (...args) => {
      addLog('error', 'Console Error', { args: args.map(String) });
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      if (args[0]?.includes?.('auth') || args[0]?.includes?.('Auth') || 
          args[0]?.includes?.('profile') || args[0]?.includes?.('Profile') ||
          args[0]?.includes?.('loading') || args[0]?.includes?.('Loading')) {
        addLog('warning', 'Console Warning', { args: args.map(String) });
      }
      originalWarn.apply(console, args);
    };

    console.log = (...args) => {
      if (args[0]?.includes?.('auth') || args[0]?.includes?.('Auth') || 
          args[0]?.includes?.('profile') || args[0]?.includes?.('Profile') ||
          args[0]?.includes?.('loading') || args[0]?.includes?.('Loading') ||
          args[0]?.includes?.('session') || args[0]?.includes?.('Session')) {
        addLog('info', 'Console Log', { args: args.map(String) });
      }
      originalLog.apply(console, args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
    };
  }, [addLog]);

  // Monitor network requests
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const url = args[0];
      if (typeof url === 'string' && (url.includes('supabase') || url.includes('profiles') || url.includes('auth'))) {
        const startTime = Date.now();
        addLog('network', `Network Request Started: ${url}`);
        
        try {
          const response = await originalFetch.apply(window, args);
          const duration = Date.now() - startTime;
          addLog('network', `Network Request Completed: ${url}`, {
            status: response.status,
            statusText: response.statusText,
            duration: `${duration}ms`,
            ok: response.ok
          });
          return response;
        } catch (error) {
          const duration = Date.now() - startTime;
          addLog('error', `Network Request Failed: ${url}`, {
            error: error.message,
            duration: `${duration}ms`
          });
          throw error;
        }
      }
      
      return originalFetch.apply(window, args);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [addLog]);

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const logText = logs.map(log => 
      `[${log.time}] ${log.type.toUpperCase()}: ${log.message}\n${log.data ? `Data: ${log.data}\n` : ''}Auth State: ${JSON.stringify(log.authState, null, 2)}\n---`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auth-debug-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'network': return 'text-blue-400';
      case 'state': return 'text-green-400';
      default: return 'text-gray-300';
    }
  };

  // Only render in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm font-mono hover:bg-gray-700"
        >
          📋 Debug Log ({logs.length})
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 w-96 h-80 bg-black text-white rounded-lg text-xs font-mono z-50 flex flex-col">
      <div className="flex items-center justify-between p-2 border-b border-gray-600">
        <h3 className="font-bold">Debug Log ({logs.length})</h3>
        <div className="flex gap-1">
          <button
            onClick={exportLogs}
            className="px-2 py-1 bg-blue-600 rounded hover:bg-blue-700"
            title="Export Logs"
          >
            💾
          </button>
          <button
            onClick={clearLogs}
            className="px-2 py-1 bg-red-600 rounded hover:bg-red-700"
            title="Clear Logs"
          >
            🗑️
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="px-2 py-1 bg-gray-600 rounded hover:bg-gray-700"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1" ref={logsRef}>
        {logs.map(log => (
          <div key={log.id} className="border-l-2 border-gray-600 pl-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">{log.time}</span>
              <span className={`font-semibold ${getLogColor(log.type)}`}>
                {log.type.toUpperCase()}
              </span>
            </div>
            <div className="text-gray-300 mt-1">{log.message}</div>
            {log.data && log.data !== '{}' && (
              <details className="mt-1">
                <summary className="text-gray-400 cursor-pointer hover:text-white">
                  Details
                </summary>
                <pre className="text-xs text-gray-400 mt-1 bg-gray-900 p-1 rounded overflow-x-auto">
                  {log.data}
                </pre>
              </details>
            )}
            <div className="text-xs text-gray-500 mt-1">
              Auth: {log.authState.isLoading ? '⏳' : '✓'} 
              {log.authState.hasUser ? ' 👤' : ' ❌'}
              {log.authState.hasProfile ? ` (${log.authState.profileRole})` : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DetailedDebugLog;
