import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Generic hook for fetching data from Supabase
export const useSupabaseQuery = (tableName, query = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Extract complex dependency for proper ESLint checking
  const queryString = JSON.stringify(query);
  const { eq: queryEq, order: queryOrder, limit: queryLimit } = query;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let supabaseQuery = supabase.from(tableName).select('*');

        // Apply filters if provided
        if (queryEq) {
          Object.entries(queryEq).forEach(([column, value]) => {
            supabaseQuery = supabaseQuery.eq(column, value);
          });
        }

        if (queryOrder) {
          supabaseQuery = supabaseQuery.order(queryOrder.column, { 
            ascending: queryOrder.ascending !== false 
          });
        }

        if (queryLimit) {
          supabaseQuery = supabaseQuery.limit(queryLimit);
        }

        const { data: result, error } = await supabaseQuery;

        if (error) throw error;
        
        setData(result || []);
        setError(null);
      } catch (err) {
        setError(err.message);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tableName, queryString, queryEq, queryOrder, queryLimit]);

  const refetch = async () => {
    setLoading(true);
    // Re-run the effect
    setError(null);
  };

  return { data, loading, error, refetch };
};

// Hook for fetching students
export const useStudents = (filters = {}) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Extract complex dependency
  const filtersString = JSON.stringify(filters);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        
        // Mock data for now - replace with actual Supabase query when database is set up
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        
        const mockStudents = [
          {
            id: 1,
            first_name: 'John',
            last_name: 'Smith',
            email: 'john.smith@campus.edu',
            student_id: 'CS2024001',
            major: 'Computer Science',
            year: 'Sophomore',
            gpa: 3.8,
            status: 'active',
            avatar_url: null,
            created_at: '2024-01-15T10:30:00Z'
          },
          {
            id: 2,
            first_name: 'Sarah',
            last_name: 'Johnson',
            email: 'sarah.johnson@campus.edu',
            student_id: 'BU2024002',
            major: 'Business Administration',
            year: 'Junior',
            gpa: 3.9,
            status: 'active',
            avatar_url: null,
            created_at: '2024-01-16T14:20:00Z'
          },
          {
            id: 3,
            first_name: 'Mike',
            last_name: 'Chen',
            email: 'mike.chen@campus.edu',
            student_id: 'EN2024003',
            major: 'Engineering',
            year: 'Senior',
            gpa: 3.7,
            status: 'active',
            avatar_url: null,
            created_at: '2024-01-17T09:15:00Z'
          }
        ];

        setStudents(mockStudents);
        setError(null);
      } catch (err) {
        setError(err.message);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [filtersString]);

  return { students, loading, error };
};

// Hook for fetching events
export const useEvents = (filters = {}) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Extract complex dependency
  const filtersString = JSON.stringify(filters);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        
        // Mock data for now
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockEvents = [
          {
            id: 1,
            title: 'Computer Science Workshop',
            description: 'Learn the fundamentals of web development with React and Node.js',
            status: 'upcoming',
            date: '2024-12-15',
            time: '14:00:00',
            location: 'Tech Lab 101',
            attendees_count: 45,
            max_attendees: 50,
            created_at: '2024-12-01T10:00:00Z'
          },
          {
            id: 2,
            title: 'Career Fair 2024',
            description: 'Meet potential employers and learn about internship opportunities',
            status: 'upcoming',
            date: '2024-12-20',
            time: '09:00:00',
            location: 'Main Auditorium',
            attendees_count: 150,
            max_attendees: 200,
            created_at: '2024-12-01T11:00:00Z'
          }
        ];

        setEvents(mockEvents);
        setError(null);
      } catch (err) {
        setError(err.message);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [filtersString]);

  return { events, loading, error };
};

// Hook for dashboard statistics
export const useDashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Mock data for now
        await new Promise(resolve => setTimeout(resolve, 600));
        
        const mockStats = {
          totalStudents: 1247,
          eventsThisWeek: 12,
          unreadMessages: 24,
          totalResources: 156,
          recentActivity: [
            {
              id: 1,
              user: 'John Smith',
              action: 'joined the Computer Science Club',
              time: '2 hours ago',
              avatar: 'JS'
            },
            {
              id: 2,
              user: 'Sarah Brown',
              action: 'created a new event: "Study Group Session"',
              time: '4 hours ago',
              avatar: 'SB'
            },
            {
              id: 3,
              user: 'Mike Wilson',
              action: 'uploaded a new resource to the library',
              time: '6 hours ago',
              avatar: 'MW'
            }
          ]
        };

        setStats(mockStats);
        setError(null);
      } catch (err) {
        setError(err.message);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
};

// Hook for creating/updating records
export const useMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (operation) => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation();
      return { data: result, error: null };
    } catch (err) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
};

// Hook for real-time subscriptions
export const useRealtimeSubscription = (tableName, callback) => {
  useEffect(() => {
    const subscription = supabase
      .channel(`public:${tableName}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: tableName }, 
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [tableName, callback]);
};
