-- Performance optimizations for events table
-- Based on PostgreSQL best practices and Supabase recommendations

-- 1. Add composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_location_date 
ON events(location_lat, location_lng, start_date) 
WHERE is_active = true;

-- 2. GIN index for JSONB ticket_links for fast JSON queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_ticket_links_gin 
ON events USING GIN (ticket_links);

-- 3. GIN index for tags array for fast tag searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_tags_gin 
ON events USING GIN (tags);

-- 4. Partial index for active events only (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_active_start_date 
ON events(start_date, category) 
WHERE is_active = true;

-- 5. Geospatial index using PostGIS for location-based queries
-- First enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geometry column for better geospatial performance
ALTER TABLE events ADD COLUMN IF NOT EXISTS location_point GEOMETRY(POINT, 4326);

-- Update existing records to populate geometry column
UPDATE events 
SET location_point = ST_SetSRID(ST_MakePoint(location_lng, location_lat), 4326)
WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;

-- Create spatial index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_location_gist 
ON events USING GIST (location_point);

-- 6. Full-text search index for title and description
ALTER TABLE events ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Update search vector for existing records
UPDATE events 
SET search_vector = to_tsvector('english', 
    COALESCE(title, '') || ' ' || 
    COALESCE(description, '') || ' ' || 
    COALESCE(category, '') || ' ' ||
    COALESCE(location_name, '')
);

-- Create GIN index for full-text search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_search_gin 
ON events USING GIN (search_vector);

-- 7. Trigger to automatically update search_vector and location_point
CREATE OR REPLACE FUNCTION update_event_computed_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Update search vector
    NEW.search_vector = to_tsvector('english', 
        COALESCE(NEW.title, '') || ' ' || 
        COALESCE(NEW.description, '') || ' ' || 
        COALESCE(NEW.category, '') || ' ' ||
        COALESCE(NEW.location_name, '')
    );
    
    -- Update location point
    IF NEW.location_lat IS NOT NULL AND NEW.location_lng IS NOT NULL THEN
        NEW.location_point = ST_SetSRID(ST_MakePoint(NEW.location_lng, NEW.location_lat), 4326);
    END IF;
    
    -- Update timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for computed fields
DROP TRIGGER IF EXISTS update_event_computed_fields_trigger ON events;
CREATE TRIGGER update_event_computed_fields_trigger
    BEFORE INSERT OR UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_event_computed_fields();

-- 8. Add popularity score calculation
ALTER TABLE events ADD COLUMN IF NOT EXISTS popularity_score DECIMAL(5,2) DEFAULT 0;

-- Function to calculate popularity score
CREATE OR REPLACE FUNCTION calculate_popularity_score(
    attendee_count INTEGER,
    days_until_event INTEGER,
    ticket_count INTEGER
) RETURNS DECIMAL(5,2) AS $$
BEGIN
    RETURN GREATEST(0, 
        (COALESCE(attendee_count, 0) * 0.01) + 
        (CASE WHEN days_until_event <= 7 THEN 10 ELSE 0 END) +
        (ticket_count * 2)
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update popularity scores for existing events
UPDATE events 
SET popularity_score = calculate_popularity_score(
    attendee_count,
    EXTRACT(DAY FROM (start_date - NOW()))::INTEGER,
    COALESCE(jsonb_array_length(ticket_links), 0)
);

-- 9. Create materialized view for popular events (faster queries)
CREATE MATERIALIZED VIEW IF NOT EXISTS popular_events AS
SELECT 
    e.*,
    ST_X(location_point) as lng,
    ST_Y(location_point) as lat,
    EXTRACT(DAY FROM (start_date - NOW())) as days_until_event
FROM events e
WHERE 
    is_active = true 
    AND start_date > NOW()
    AND start_date < NOW() + INTERVAL '6 months'
ORDER BY popularity_score DESC, start_date ASC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_popular_events_location 
ON popular_events(lng, lat, start_date);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_popular_events()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY popular_events;
END;
$$ LANGUAGE plpgsql;

-- 10. Add event statistics table for analytics
CREATE TABLE IF NOT EXISTS event_stats (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT REFERENCES events(id) ON DELETE CASCADE,
    views INTEGER DEFAULT 0,
    favorites INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    last_viewed TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id)
);

-- Index for event stats
CREATE INDEX IF NOT EXISTS idx_event_stats_event_id ON event_stats(event_id);
CREATE INDEX IF NOT EXISTS idx_event_stats_views ON event_stats(views DESC);

-- 11. Optimize RLS policies for better performance
DROP POLICY IF EXISTS "Allow read access to all users" ON events;
DROP POLICY IF EXISTS "Allow insert/update for service role" ON events;

-- More specific RLS policies
CREATE POLICY "events_select_policy" ON events
    FOR SELECT USING (is_active = true);

CREATE POLICY "events_insert_policy" ON events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "events_update_policy" ON events
    FOR UPDATE USING (true);

-- 12. Add database functions for common queries
CREATE OR REPLACE FUNCTION get_events_near_location(
    user_lat DECIMAL,
    user_lng DECIMAL,
    radius_miles INTEGER DEFAULT 25,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id BIGINT,
    title TEXT,
    description TEXT,
    category TEXT,
    start_date TIMESTAMPTZ,
    location_name TEXT,
    location_lat DECIMAL,
    location_lng DECIMAL,
    image_url TEXT,
    price_min DECIMAL,
    price_max DECIMAL,
    distance_miles DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.description,
        e.category,
        e.start_date,
        e.location_name,
        e.location_lat,
        e.location_lng,
        e.image_url,
        e.price_min,
        e.price_max,
        ST_Distance(
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
            e.location_point::geography
        ) / 1609.34 as distance_miles
    FROM events e
    WHERE 
        e.is_active = true
        AND e.start_date > NOW()
        AND e.location_point IS NOT NULL
        AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
            e.location_point::geography,
            radius_miles * 1609.34
        )
    ORDER BY distance_miles ASC, e.popularity_score DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- 13. Create function for full-text search
CREATE OR REPLACE FUNCTION search_events_fulltext(
    search_query TEXT,
    user_lat DECIMAL DEFAULT NULL,
    user_lng DECIMAL DEFAULT NULL,
    radius_miles INTEGER DEFAULT 50,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    id BIGINT,
    title TEXT,
    description TEXT,
    category TEXT,
    start_date TIMESTAMPTZ,
    location_name TEXT,
    image_url TEXT,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.description,
        e.category,
        e.start_date,
        e.location_name,
        e.image_url,
        ts_rank(e.search_vector, plainto_tsquery('english', search_query)) as rank
    FROM events e
    WHERE 
        e.is_active = true
        AND e.start_date > NOW()
        AND e.search_vector @@ plainto_tsquery('english', search_query)
        AND (
            user_lat IS NULL OR user_lng IS NULL OR
            ST_DWithin(
                ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
                e.location_point::geography,
                radius_miles * 1609.34
            )
        )
    ORDER BY rank DESC, e.popularity_score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- 14. Add analytics increment functions
CREATE OR REPLACE FUNCTION increment_event_views(event_id BIGINT)
RETURNS void AS $$
BEGIN
    INSERT INTO event_stats (event_id, views, last_viewed)
    VALUES (event_id, 1, NOW())
    ON CONFLICT (event_id)
    DO UPDATE SET
        views = event_stats.views + 1,
        last_viewed = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_event_clicks(event_id BIGINT)
RETURNS void AS $$
BEGIN
    INSERT INTO event_stats (event_id, clicks)
    VALUES (event_id, 1)
    ON CONFLICT (event_id)
    DO UPDATE SET
        clicks = event_stats.clicks + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_event_favorites(event_id BIGINT)
RETURNS void AS $$
BEGIN
    INSERT INTO event_stats (event_id, favorites)
    VALUES (event_id, 1)
    ON CONFLICT (event_id)
    DO UPDATE SET
        favorites = event_stats.favorites + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_event_favorites(event_id BIGINT)
RETURNS void AS $$
BEGIN
    INSERT INTO event_stats (event_id, favorites)
    VALUES (event_id, -1)
    ON CONFLICT (event_id)
    DO UPDATE SET
        favorites = GREATEST(0, event_stats.favorites - 1),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
