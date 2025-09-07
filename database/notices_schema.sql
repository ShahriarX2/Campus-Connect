-- ===================================================
-- CAMPUS CONNECT - NOTICES TABLE SCHEMA
-- ===================================================
-- This script creates the notices table with all required columns,
-- constraints, indexes, and Row Level Security (RLS) policies.

-- Create the notices table
CREATE TABLE IF NOT EXISTS notices (
    -- Primary key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Notice content fields
    title VARCHAR(255) NOT NULL CHECK (length(trim(title)) > 0),
    content TEXT NOT NULL CHECK (length(trim(content)) > 0),
    
    -- Categorization
    category VARCHAR(50) NOT NULL CHECK (category IN ('exam', 'class', 'event', 'general')),
    
    -- Priority and importance
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    is_important BOOLEAN DEFAULT false,
    
    -- Visibility and targeting
    target_audience VARCHAR(20) DEFAULT 'all' CHECK (target_audience IN ('all', 'students', 'teachers', 'admins')),
    
    -- Status and publishing
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived', 'expired')),
    
    -- Date and time fields
    publish_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expiry_date TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    posted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_expiry_date CHECK (expiry_date IS NULL OR expiry_date > publish_date)
);

-- ===================================================
-- INDEXES FOR PERFORMANCE
-- ===================================================

-- Index for filtering by category and status (most common queries)
CREATE INDEX IF NOT EXISTS idx_notices_category_status 
ON notices (category, status);

-- Index for filtering by target audience and status
CREATE INDEX IF NOT EXISTS idx_notices_target_status 
ON notices (target_audience, status);

-- Index for ordering by creation date (most common sort)
CREATE INDEX IF NOT EXISTS idx_notices_created_at 
ON notices (created_at DESC);

-- Index for filtering by published date and status
CREATE INDEX IF NOT EXISTS idx_notices_publish_status 
ON notices (publish_date DESC, status);

-- Index for filtering by priority and status
CREATE INDEX IF NOT EXISTS idx_notices_priority_status 
ON notices (priority, status);

-- Index for filtering by posted_by (author queries)
CREATE INDEX IF NOT EXISTS idx_notices_posted_by 
ON notices (posted_by);

-- Index for filtering by important notices
CREATE INDEX IF NOT EXISTS idx_notices_important 
ON notices (is_important, status) WHERE is_important = true;

-- Partial index for active notices (most queried status)
CREATE INDEX IF NOT EXISTS idx_notices_active 
ON notices (created_at DESC, category) WHERE status = 'active';

-- ===================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================================

-- Enable RLS on the notices table
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow all authenticated users to READ active notices
CREATE POLICY "Users can read active notices" ON notices
    FOR SELECT
    TO authenticated
    USING (
        status = 'active' 
        AND (
            target_audience = 'all' 
            OR target_audience = (
                SELECT role FROM profiles WHERE profiles.id = auth.uid()
            )
        )
        AND (
            expiry_date IS NULL 
            OR expiry_date > now()
        )
    );

-- Policy 2: Allow teachers and admins to read all notices (including drafts)
CREATE POLICY "Teachers and admins can read all notices" ON notices
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('teacher', 'admin')
        )
    );

-- Policy 3: Allow teachers and admins to create notices
CREATE POLICY "Teachers and admins can create notices" ON notices
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('teacher', 'admin')
        )
        AND posted_by = auth.uid()
    );

-- Policy 4: Allow notice authors to update their own notices
CREATE POLICY "Authors can update their notices" ON notices
    FOR UPDATE
    TO authenticated
    USING (posted_by = auth.uid())
    WITH CHECK (posted_by = auth.uid());

-- Policy 5: Allow admins to update any notice
CREATE POLICY "Admins can update any notice" ON notices
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

-- Policy 6: Allow notice authors to delete their own notices
CREATE POLICY "Authors can delete their notices" ON notices
    FOR DELETE
    TO authenticated
    USING (posted_by = auth.uid());

-- Policy 7: Allow admins to delete any notice
CREATE POLICY "Admins can delete any notice" ON notices
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
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- ===================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_notices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on row updates
CREATE TRIGGER update_notices_updated_at_trigger
    BEFORE UPDATE ON notices
    FOR EACH ROW
    EXECUTE FUNCTION update_notices_updated_at();

-- ===================================================
-- FUNCTION FOR AUTOMATIC NOTICE EXPIRY
-- ===================================================

-- Function to mark expired notices as 'expired'
CREATE OR REPLACE FUNCTION mark_expired_notices()
RETURNS void AS $$
BEGIN
    UPDATE notices 
    SET status = 'expired', updated_at = now()
    WHERE status = 'active' 
    AND expiry_date IS NOT NULL 
    AND expiry_date <= now();
END;
$$ LANGUAGE plpgsql;

-- ===================================================
-- INITIAL DATA (SAMPLE NOTICES)
-- ===================================================

-- Insert sample notices (only if the table is empty)
-- Note: Replace the posted_by UUIDs with actual user IDs from your profiles table
INSERT INTO notices (title, content, category, priority, is_important, target_audience, status, posted_by)
SELECT 
    'Welcome to Campus Connect!',
    'We are excited to introduce Campus Connect, your new platform for staying connected with campus activities, announcements, and important information. Please explore all the features and let us know if you have any questions.',
    'general',
    'high',
    true,
    'all',
    'active',
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM notices LIMIT 1)
AND EXISTS (SELECT 1 FROM profiles WHERE role = 'admin');

INSERT INTO notices (title, content, category, priority, target_audience, status, posted_by)
SELECT 
    'Mid-term Examination Schedule',
    'The mid-term examinations will be conducted from March 15th to March 22nd, 2024. Please check your individual timetables for specific dates and timings. All students are required to carry their ID cards during the examination.',
    'exam',
    'urgent',
    'students',
    'active',
    (SELECT id FROM profiles WHERE role = 'teacher' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM notices WHERE category = 'exam')
AND EXISTS (SELECT 1 FROM profiles WHERE role = 'teacher');

-- ===================================================
-- COMMENTS AND DOCUMENTATION
-- ===================================================

-- Add comments to the table and important columns for documentation
COMMENT ON TABLE notices IS 'Stores campus notices and announcements with role-based access control';
COMMENT ON COLUMN notices.title IS 'Short, descriptive title for the notice (max 255 chars)';
COMMENT ON COLUMN notices.content IS 'Full content/body of the notice';
COMMENT ON COLUMN notices.category IS 'Type of notice: exam, class, event, or general';
COMMENT ON COLUMN notices.priority IS 'Priority level: low, medium, high, or urgent';
COMMENT ON COLUMN notices.is_important IS 'Flag for highlighting important notices';
COMMENT ON COLUMN notices.target_audience IS 'Who can see this notice: all, students, teachers, or admins';
COMMENT ON COLUMN notices.status IS 'Current status: draft, active, archived, or expired';
COMMENT ON COLUMN notices.publish_date IS 'When the notice becomes visible';
COMMENT ON COLUMN notices.expiry_date IS 'When the notice expires (optional)';
COMMENT ON COLUMN notices.posted_by IS 'Foreign key to profiles table (author)';

-- ===================================================
-- PERFORMANCE OPTIMIZATION NOTES
-- ===================================================

-- For optimal performance:
-- 1. Most queries should filter by status='active' first
-- 2. Use category and target_audience filters together when possible
-- 3. The publish_date and expiry_date should be used for time-based filtering
-- 4. Consider partitioning by created_at for very large datasets
-- 5. Regular cleanup of expired/archived notices may be beneficial

-- ===================================================
-- SECURITY NOTES
-- ===================================================

-- RLS Policies ensure:
-- 1. Students only see notices targeted to them or 'all'
-- 2. Only active, non-expired notices are visible to regular users
-- 3. Teachers/admins can see all notices including drafts
-- 4. Only authorized users can create/edit/delete notices
-- 5. Authors can only modify their own notices (except admins)

-- End of schema
