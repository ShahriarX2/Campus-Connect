-- ===================================================
-- CAMPUS CONNECT - FORUM SYSTEM SCHEMA
-- ===================================================
-- This script creates the forum_posts and forum_comments tables with
-- constraints, indexes, and Row Level Security (RLS) policies.

-- Create the forum_posts table
CREATE TABLE IF NOT EXISTS forum_posts (
    -- Primary key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Post content fields
    title VARCHAR(255) NOT NULL CHECK (length(trim(title)) > 0),
    content TEXT NOT NULL CHECK (length(trim(content)) > 0),
    tag VARCHAR(50) CHECK (tag IS NULL OR length(trim(tag)) > 0),
    
    -- Engagement
    upvotes INTEGER DEFAULT 0 CHECK (upvotes >= 0),
    
    -- Audit fields
    posted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create the forum_comments table
CREATE TABLE IF NOT EXISTS forum_comments (
    -- Primary key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Foreign keys
    post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    
    -- Comment content
    content TEXT NOT NULL CHECK (length(trim(content)) > 0),
    
    -- Audit fields
    posted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create the post_upvotes table for tracking user upvotes
CREATE TABLE IF NOT EXISTS post_upvotes (
    -- Primary key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Foreign keys
    post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Unique constraint to prevent duplicate upvotes
    UNIQUE(post_id, user_id)
);

-- ===================================================
-- INDEXES FOR PERFORMANCE
-- ===================================================

-- Forum posts table indexes
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at 
ON forum_posts (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_forum_posts_posted_by 
ON forum_posts (posted_by);

CREATE INDEX IF NOT EXISTS idx_forum_posts_tag 
ON forum_posts (tag) WHERE tag IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_forum_posts_title 
ON forum_posts USING gin(to_tsvector('english', title));

CREATE INDEX IF NOT EXISTS idx_forum_posts_content 
ON forum_posts USING gin(to_tsvector('english', content));

CREATE INDEX IF NOT EXISTS idx_forum_posts_upvotes 
ON forum_posts (upvotes DESC, created_at DESC);

-- Forum comments table indexes
CREATE INDEX IF NOT EXISTS idx_forum_comments_post_id 
ON forum_comments (post_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_forum_comments_posted_by 
ON forum_comments (posted_by);

CREATE INDEX IF NOT EXISTS idx_forum_comments_created_at 
ON forum_comments (created_at DESC);

-- Post upvotes table indexes
CREATE INDEX IF NOT EXISTS idx_post_upvotes_post_id 
ON post_upvotes (post_id);

CREATE INDEX IF NOT EXISTS idx_post_upvotes_user_id 
ON post_upvotes (user_id);

-- ===================================================
-- ROW LEVEL SECURITY (RLS) POLICIES - FORUM_POSTS
-- ===================================================

-- Enable RLS on the forum_posts table
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

-- Policy 1: All authenticated users can read posts
CREATE POLICY "Users can read all posts" ON forum_posts
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy 2: All authenticated users can create posts
CREATE POLICY "Users can create posts" ON forum_posts
    FOR INSERT
    TO authenticated
    WITH CHECK (posted_by = auth.uid());

-- Policy 3: Users can update their own posts
CREATE POLICY "Users can update their own posts" ON forum_posts
    FOR UPDATE
    TO authenticated
    USING (posted_by = auth.uid())
    WITH CHECK (posted_by = auth.uid());

-- Policy 4: Admins can update any post
CREATE POLICY "Admins can update any post" ON forum_posts
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

-- Policy 5: Users can delete their own posts
CREATE POLICY "Users can delete their own posts" ON forum_posts
    FOR DELETE
    TO authenticated
    USING (posted_by = auth.uid());

-- Policy 6: Admins can delete any post
CREATE POLICY "Admins can delete any post" ON forum_posts
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
-- RLS POLICIES - FORUM_COMMENTS
-- ===================================================

-- Enable RLS on the forum_comments table
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;

-- Policy 1: All authenticated users can read comments
CREATE POLICY "Users can read all comments" ON forum_comments
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy 2: All authenticated users can create comments
CREATE POLICY "Users can create comments" ON forum_comments
    FOR INSERT
    TO authenticated
    WITH CHECK (posted_by = auth.uid());

-- Policy 3: Users can update their own comments
CREATE POLICY "Users can update their own comments" ON forum_comments
    FOR UPDATE
    TO authenticated
    USING (posted_by = auth.uid())
    WITH CHECK (posted_by = auth.uid());

-- Policy 4: Admins can update any comment
CREATE POLICY "Admins can update any comment" ON forum_comments
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

-- Policy 5: Users can delete their own comments
CREATE POLICY "Users can delete their own comments" ON forum_comments
    FOR DELETE
    TO authenticated
    USING (posted_by = auth.uid());

-- Policy 6: Admins can delete any comment
CREATE POLICY "Admins can delete any comment" ON forum_comments
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
-- RLS POLICIES - POST_UPVOTES
-- ===================================================

-- Enable RLS on the post_upvotes table
ALTER TABLE post_upvotes ENABLE ROW LEVEL SECURITY;

-- Policy 1: All authenticated users can read upvotes
CREATE POLICY "Users can read upvotes" ON post_upvotes
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy 2: Users can manage their own upvotes
CREATE POLICY "Users can manage their own upvotes" ON post_upvotes
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ===================================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- ===================================================

-- Function to update the updated_at timestamp for posts
CREATE OR REPLACE FUNCTION update_forum_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for forum_posts table
CREATE TRIGGER update_forum_posts_updated_at_trigger
    BEFORE UPDATE ON forum_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_forum_posts_updated_at();

-- Function to update the updated_at timestamp for comments
CREATE OR REPLACE FUNCTION update_forum_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for forum_comments table
CREATE TRIGGER update_forum_comments_updated_at_trigger
    BEFORE UPDATE ON forum_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_forum_comments_updated_at();

-- ===================================================
-- TRIGGER FOR UPVOTE COUNT MANAGEMENT
-- ===================================================

-- Function to update upvote count
CREATE OR REPLACE FUNCTION update_post_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the upvotes count on the post
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_posts 
        SET upvotes = upvotes + 1, updated_at = now()
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_posts 
        SET upvotes = GREATEST(upvotes - 1, 0), updated_at = now()
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update upvote counts
CREATE TRIGGER update_post_upvote_count_trigger
    AFTER INSERT OR DELETE ON post_upvotes
    FOR EACH ROW
    EXECUTE FUNCTION update_post_upvote_count();

-- ===================================================
-- VIEWS FOR COMMON QUERIES
-- ===================================================

-- View for posts with author information and comment counts
CREATE OR REPLACE VIEW forum_posts_with_details AS
SELECT 
    p.*,
    author.name as author_name,
    author.role as author_role,
    author.avatar_url as author_avatar,
    COALESCE(comment_count.count, 0) as comment_count
FROM forum_posts p
LEFT JOIN profiles author ON p.posted_by = author.id
LEFT JOIN (
    SELECT post_id, COUNT(*) as count 
    FROM forum_comments 
    GROUP BY post_id
) comment_count ON p.id = comment_count.post_id;

-- View for comments with author information
CREATE OR REPLACE VIEW forum_comments_with_details AS
SELECT 
    c.*,
    author.name as author_name,
    author.role as author_role,
    author.avatar_url as author_avatar
FROM forum_comments c
LEFT JOIN profiles author ON c.posted_by = author.id;

-- ===================================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- ===================================================

-- Function to toggle post upvote
CREATE OR REPLACE FUNCTION toggle_post_upvote(
    post_uuid UUID, 
    user_uuid UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    upvote_exists BOOLEAN;
BEGIN
    -- Check if upvote exists
    SELECT EXISTS(
        SELECT 1 FROM post_upvotes 
        WHERE post_id = post_uuid AND user_id = user_uuid
    ) INTO upvote_exists;
    
    IF upvote_exists THEN
        -- Remove upvote
        DELETE FROM post_upvotes 
        WHERE post_id = post_uuid AND user_id = user_uuid;
        RETURN FALSE; -- Upvote removed
    ELSE
        -- Add upvote
        INSERT INTO post_upvotes (post_id, user_id)
        VALUES (post_uuid, user_uuid);
        RETURN TRUE; -- Upvote added
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has upvoted a post
CREATE OR REPLACE FUNCTION has_user_upvoted(
    post_uuid UUID, 
    user_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM post_upvotes 
        WHERE post_id = post_uuid AND user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search posts
CREATE OR REPLACE FUNCTION search_posts(
    search_query TEXT DEFAULT NULL,
    tag_filter TEXT DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    title VARCHAR,
    content TEXT,
    tag VARCHAR,
    upvotes INTEGER,
    posted_by UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    author_name TEXT,
    author_role VARCHAR,
    author_avatar TEXT,
    comment_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.content,
        p.tag,
        p.upvotes,
        p.posted_by,
        p.created_at,
        p.updated_at,
        p.author_name,
        p.author_role,
        p.author_avatar,
        p.comment_count
    FROM forum_posts_with_details p
    WHERE 
        (search_query IS NULL OR 
         p.title ILIKE '%' || search_query || '%' OR 
         p.content ILIKE '%' || search_query || '%' OR
         to_tsvector('english', p.title || ' ' || p.content) @@ plainto_tsquery('english', search_query))
        AND (tag_filter IS NULL OR p.tag = tag_filter)
    ORDER BY p.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================
-- SAMPLE DATA (OPTIONAL)
-- ===================================================

-- Insert sample forum posts (only if tables are empty and users exist)
-- Note: These are optional sample posts that will only be created if the conditions are met

-- Sample post 1: Welcome post by admin/teacher
DO $$
DECLARE
    sample_user_id UUID;
BEGIN
    -- Find a teacher or admin user
    SELECT id INTO sample_user_id 
    FROM profiles 
    WHERE role IN ('teacher', 'admin') 
    LIMIT 1;
    
    -- Only insert if we found a user and no posts exist
    IF sample_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM forum_posts LIMIT 1) THEN
        INSERT INTO forum_posts (title, content, tag, posted_by)
        VALUES (
            'Welcome to the Campus Forum!',
            'This is our new discussion forum where students, teachers, and staff can engage in meaningful conversations about academic life, campus events, and various topics of interest. Feel free to share your thoughts, ask questions, and help build our community!',
            'general',
            sample_user_id
        );
    END IF;
END $$;

-- Sample post 2: Study tips by student
DO $$
DECLARE
    sample_user_id UUID;
BEGIN
    -- Find a student user
    SELECT id INTO sample_user_id 
    FROM profiles 
    WHERE role = 'student' 
    LIMIT 1;
    
    -- Only insert if we found a user and this specific post doesn't exist
    IF sample_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM forum_posts WHERE title = 'Study Tips for Final Exams') THEN
        INSERT INTO forum_posts (title, content, tag, posted_by)
        VALUES (
            'Study Tips for Final Exams',
            'With final exams approaching, I thought I''d share some study techniques that have worked well for me: 1) Create a study schedule and stick to it, 2) Use active recall instead of just re-reading notes, 3) Form study groups with classmates, 4) Take regular breaks to avoid burnout. What study methods work best for you?',
            'academic',
            sample_user_id
        );
    END IF;
END $$;

-- Sample post 3: Technical issue by another student
DO $$
DECLARE
    sample_user_id UUID;
BEGIN
    -- Find a different student user (using OFFSET)
    SELECT id INTO sample_user_id 
    FROM profiles 
    WHERE role = 'student' 
    OFFSET 1
    LIMIT 1;
    
    -- If no second student found, use any student
    IF sample_user_id IS NULL THEN
        SELECT id INTO sample_user_id 
        FROM profiles 
        WHERE role = 'student' 
        LIMIT 1;
    END IF;
    
    -- Only insert if we found a user and this specific post doesn't exist
    IF sample_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM forum_posts WHERE title = 'Campus WiFi Issues') THEN
        INSERT INTO forum_posts (title, content, tag, posted_by)
        VALUES (
            'Campus WiFi Issues',
            'Has anyone else been experiencing slow internet speeds in the library lately? It''s been really difficult to access online resources for research. Are there any alternative study spaces with better connectivity?',
            'technical',
            sample_user_id
        );
    END IF;
END $$;

-- ===================================================
-- COMMENTS AND DOCUMENTATION
-- ===================================================

COMMENT ON TABLE forum_posts IS 'Stores forum posts with upvoting functionality';
COMMENT ON COLUMN forum_posts.title IS 'Post title (max 255 chars)';
COMMENT ON COLUMN forum_posts.content IS 'Full content of the post';
COMMENT ON COLUMN forum_posts.tag IS 'Optional category tag for the post';
COMMENT ON COLUMN forum_posts.upvotes IS 'Number of upvotes (managed by triggers)';
COMMENT ON COLUMN forum_posts.posted_by IS 'User who created the post';

COMMENT ON TABLE forum_comments IS 'Stores comments on forum posts';
COMMENT ON COLUMN forum_comments.post_id IS 'Foreign key to forum_posts';
COMMENT ON COLUMN forum_comments.content IS 'Content of the comment';
COMMENT ON COLUMN forum_comments.posted_by IS 'User who created the comment';

COMMENT ON TABLE post_upvotes IS 'Tracks which users have upvoted which posts';

COMMENT ON VIEW forum_posts_with_details IS 'Posts with author info and comment counts';
COMMENT ON VIEW forum_comments_with_details IS 'Comments with author information';

-- ===================================================
-- SECURITY NOTES
-- ===================================================

-- RLS Policies ensure:
-- 1. All authenticated users can read posts and comments
-- 2. All authenticated users can create posts and comments
-- 3. Users can only edit/delete their own content (except admins)
-- 4. Admins can moderate any content
-- 5. Upvote system prevents duplicate votes per user

-- ===================================================
-- PERFORMANCE NOTES
-- ===================================================

-- Optimizations included:
-- 1. Full-text search indexes for title and content
-- 2. Composite indexes for common query patterns
-- 3. Views with pre-calculated comment counts
-- 4. Efficient upvote counting with triggers
-- 5. Search function with flexible filtering

-- End of schema
