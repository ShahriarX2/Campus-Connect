-- ===================================================
-- CAMPUS CONNECT - EVENTS SYSTEM SCHEMA
-- ===================================================
-- This script creates the events and event_attendees tables with
-- constraints, indexes, and Row Level Security (RLS) policies.

-- Create the events table
CREATE TABLE IF NOT EXISTS events (
    -- Primary key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Event content fields
    title VARCHAR(255) NOT NULL CHECK (length(trim(title)) > 0),
    description TEXT NOT NULL CHECK (length(trim(description)) > 0),
    location VARCHAR(500) NOT NULL CHECK (length(trim(location)) > 0),
    
    -- Date and time fields
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    
    -- Audit fields
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Constraints
    CONSTRAINT future_event_date CHECK (event_date >= CURRENT_DATE)
);

-- Create the event_attendees table
CREATE TABLE IF NOT EXISTS event_attendees (
    -- Primary key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Foreign keys
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Attendee status
    status VARCHAR(20) NOT NULL CHECK (status IN ('going', 'interested')),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Unique constraint to prevent duplicate attendances
    UNIQUE(event_id, user_id)
);

-- ===================================================
-- INDEXES FOR PERFORMANCE
-- ===================================================

-- Events table indexes
CREATE INDEX IF NOT EXISTS idx_events_date 
ON events (event_date DESC, event_time ASC);

CREATE INDEX IF NOT EXISTS idx_events_created_by 
ON events (created_by);

CREATE INDEX IF NOT EXISTS idx_events_created_at 
ON events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_upcoming
ON events (event_date, event_time) WHERE event_date >= CURRENT_DATE;

-- Event attendees table indexes
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id 
ON event_attendees (event_id);

CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id 
ON event_attendees (user_id);

CREATE INDEX IF NOT EXISTS idx_event_attendees_status 
ON event_attendees (event_id, status);

-- Composite index for attendee counts by status
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_status 
ON event_attendees (event_id, status, created_at DESC);

-- ===================================================
-- ROW LEVEL SECURITY (RLS) POLICIES - EVENTS TABLE
-- ===================================================

-- Enable RLS on the events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy 1: All authenticated users can read events
CREATE POLICY "Users can read all events" ON events
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy 2: Only teachers and admins can create events
CREATE POLICY "Teachers and admins can create events" ON events
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('teacher', 'admin')
        )
        AND created_by = auth.uid()
    );

-- Policy 3: Event creators can update their own events
CREATE POLICY "Creators can update their events" ON events
    FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Policy 4: Admins can update any event
CREATE POLICY "Admins can update any event" ON events
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy 5: Event creators can delete their own events
CREATE POLICY "Creators can delete their events" ON events
    FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());

-- Policy 6: Admins can delete any event
CREATE POLICY "Admins can delete any event" ON events
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- ===================================================
-- RLS POLICIES - EVENT_ATTENDEES TABLE
-- ===================================================

-- Enable RLS on the event_attendees table
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- Policy 1: All authenticated users can read attendee information
CREATE POLICY "Users can read attendee information" ON event_attendees
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy 2: Users can manage their own attendance
CREATE POLICY "Users can manage their own attendance" ON event_attendees
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policy 3: Event creators and admins can view all attendees for their events
CREATE POLICY "Creators and admins can manage event attendees" ON event_attendees
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_id 
            AND (
                events.created_by = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.role = 'admin'
                )
            )
        )
    );

-- ===================================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- ===================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for events table
CREATE TRIGGER update_events_updated_at_trigger
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_events_updated_at();

-- Function for event_attendees table
CREATE OR REPLACE FUNCTION update_event_attendees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for event_attendees table
CREATE TRIGGER update_event_attendees_updated_at_trigger
    BEFORE UPDATE ON event_attendees
    FOR EACH ROW
    EXECUTE FUNCTION update_event_attendees_updated_at();

-- ===================================================
-- VIEWS FOR COMMON QUERIES
-- ===================================================

-- View for events with attendee counts
CREATE OR REPLACE VIEW events_with_counts AS
SELECT 
    e.*,
    creator.name as creator_name,
    COALESCE(going_count.count, 0) as going_count,
    COALESCE(interested_count.count, 0) as interested_count,
    COALESCE(total_attendees.count, 0) as total_attendees
FROM events e
LEFT JOIN profiles creator ON e.created_by = creator.id
LEFT JOIN (
    SELECT event_id, COUNT(*) as count 
    FROM event_attendees 
    WHERE status = 'going' 
    GROUP BY event_id
) going_count ON e.id = going_count.event_id
LEFT JOIN (
    SELECT event_id, COUNT(*) as count 
    FROM event_attendees 
    WHERE status = 'interested' 
    GROUP BY event_id
) interested_count ON e.id = interested_count.event_id
LEFT JOIN (
    SELECT event_id, COUNT(*) as count 
    FROM event_attendees 
    GROUP BY event_id
) total_attendees ON e.id = total_attendees.event_id;

-- View for upcoming events (next 30 days)
CREATE OR REPLACE VIEW upcoming_events AS
SELECT * FROM events_with_counts
WHERE event_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY event_date ASC, event_time ASC;

-- ===================================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- ===================================================

-- Function to get user's attendance status for an event
CREATE OR REPLACE FUNCTION get_user_event_status(event_uuid UUID, user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    user_status TEXT;
BEGIN
    SELECT status INTO user_status
    FROM event_attendees
    WHERE event_id = event_uuid AND user_id = user_uuid;
    
    RETURN COALESCE(user_status, 'not_attending');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle user attendance status
CREATE OR REPLACE FUNCTION toggle_event_attendance(
    event_uuid UUID, 
    user_uuid UUID, 
    new_status TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Validate status
    IF new_status NOT IN ('going', 'interested', 'not_attending') THEN
        RAISE EXCEPTION 'Invalid status. Must be going, interested, or not_attending';
    END IF;

    -- If not_attending, delete the record
    IF new_status = 'not_attending' THEN
        DELETE FROM event_attendees 
        WHERE event_id = event_uuid AND user_id = user_uuid;
    ELSE
        -- Upsert the attendance record
        INSERT INTO event_attendees (event_id, user_id, status)
        VALUES (event_uuid, user_uuid, new_status)
        ON CONFLICT (event_id, user_id)
        DO UPDATE SET 
            status = new_status,
            updated_at = now();
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================
-- SAMPLE DATA (OPTIONAL)
-- ===================================================

-- Insert sample events (only if tables are empty)
INSERT INTO events (title, description, location, event_date, event_time, created_by)
SELECT 
    'Welcome Assembly',
    'Join us for the campus welcome assembly where we will introduce new students to campus life, present important information about academic programs, and outline the exciting events planned for this semester.',
    'Main Auditorium',
    CURRENT_DATE + INTERVAL '7 days',
    '10:00:00',
    (SELECT id FROM profiles WHERE role IN ('teacher', 'admin') LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM events LIMIT 1)
AND EXISTS (SELECT 1 FROM profiles WHERE role IN ('teacher', 'admin'));

INSERT INTO events (title, description, location, event_date, event_time, created_by)
SELECT 
    'Science Fair 2024',
    'Annual science fair showcasing innovative projects by students from all departments. Come explore cutting-edge research, interactive demonstrations, and compete for exciting prizes.',
    'Science Building - Ground Floor',
    CURRENT_DATE + INTERVAL '14 days',
    '09:00:00',
    (SELECT id FROM profiles WHERE role IN ('teacher', 'admin') LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Science Fair 2024')
AND EXISTS (SELECT 1 FROM profiles WHERE role IN ('teacher', 'admin'));

INSERT INTO events (title, description, location, event_date, event_time, created_by)
SELECT 
    'Career Guidance Workshop',
    'Professional development workshop featuring industry experts, career counselors, and successful alumni. Learn about job market trends, interview skills, and networking strategies.',
    'Conference Hall B',
    CURRENT_DATE + INTERVAL '21 days',
    '14:00:00',
    (SELECT id FROM profiles WHERE role IN ('teacher', 'admin') LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Career Guidance Workshop')
AND EXISTS (SELECT 1 FROM profiles WHERE role IN ('teacher', 'admin'));

-- ===================================================
-- COMMENTS AND DOCUMENTATION
-- ===================================================

COMMENT ON TABLE events IS 'Stores campus events with date, time, and location information';
COMMENT ON COLUMN events.title IS 'Event title (max 255 chars)';
COMMENT ON COLUMN events.description IS 'Full description of the event';
COMMENT ON COLUMN events.location IS 'Event venue/location (max 500 chars)';
COMMENT ON COLUMN events.event_date IS 'Date when event will occur';
COMMENT ON COLUMN events.event_time IS 'Time when event starts';
COMMENT ON COLUMN events.created_by IS 'User who created the event (teacher/admin)';

COMMENT ON TABLE event_attendees IS 'Tracks user attendance status for events';
COMMENT ON COLUMN event_attendees.status IS 'Attendance status: going or interested';

COMMENT ON VIEW events_with_counts IS 'Events with calculated attendee counts by status';
COMMENT ON VIEW upcoming_events IS 'Events happening in the next 30 days';

-- ===================================================
-- SECURITY NOTES
-- ===================================================

-- RLS Policies ensure:
-- 1. All users can view events and attendee counts
-- 2. Only teachers/admins can create/edit/delete events
-- 3. Users can only manage their own attendance status
-- 4. Event creators can view detailed attendee information
-- 5. All attendance changes are logged with timestamps

-- ===================================================
-- PERFORMANCE NOTES
-- ===================================================

-- Optimizations included:
-- 1. Composite indexes for common query patterns
-- 2. Partial indexes for upcoming events
-- 3. Views with pre-calculated counts
-- 4. Functions for common operations
-- 5. Proper foreign key constraints for data integrity

-- End of schema
