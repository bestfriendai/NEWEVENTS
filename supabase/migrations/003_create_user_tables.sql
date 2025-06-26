-- Create user-related tables for favorites, profiles, and user data

-- 1. User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    username TEXT UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    preferences JSONB DEFAULT '{}'::jsonb,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id BIGINT REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one favorite per user per event
    CONSTRAINT unique_user_event_favorite UNIQUE (user_id, event_id)
);

-- 3. User event interactions table (views, clicks, etc.)
CREATE TABLE IF NOT EXISTS user_event_interactions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id BIGINT REFERENCES events(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'click', 'share', 'save')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Index for efficient queries
    UNIQUE (user_id, event_id, interaction_type, created_at)
);

-- 4. User saved searches table
CREATE TABLE IF NOT EXISTS user_saved_searches (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    search_name TEXT NOT NULL,
    search_query TEXT,
    search_filters JSONB DEFAULT '{}'::jsonb,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    radius_miles INTEGER DEFAULT 25,
    notification_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_location ON user_profiles(location_lat, location_lng);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_event_id ON user_favorites(event_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON user_favorites(created_at);

CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_event_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_event_id ON user_event_interactions(event_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_event_interactions(interaction_type);

CREATE INDEX IF NOT EXISTS idx_user_saved_searches_user_id ON user_saved_searches(user_id);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_user_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_user_updated_at_column();

CREATE TRIGGER update_user_saved_searches_updated_at 
    BEFORE UPDATE ON user_saved_searches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_user_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_event_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User profiles: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id OR is_public = true);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- User favorites: Users can only see/manage their own favorites
CREATE POLICY "Users can view own favorites" ON user_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites" ON user_favorites
    FOR ALL USING (auth.uid() = user_id);

-- User interactions: Users can only see/add their own interactions
CREATE POLICY "Users can view own interactions" ON user_event_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add own interactions" ON user_event_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User saved searches: Users can only see/manage their own searches
CREATE POLICY "Users can view own saved searches" ON user_saved_searches
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own saved searches" ON user_saved_searches
    FOR ALL USING (auth.uid() = user_id);

-- Helper functions

-- Function to get user's favorite events
CREATE OR REPLACE FUNCTION get_user_favorite_events(
    user_uuid UUID,
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
    favorited_at TIMESTAMPTZ
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
        uf.created_at as favorited_at
    FROM events e
    INNER JOIN user_favorites uf ON e.id = uf.event_id
    WHERE 
        uf.user_id = user_uuid
        AND e.is_active = true
        AND e.start_date > NOW()
    ORDER BY uf.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to toggle favorite status
CREATE OR REPLACE FUNCTION toggle_event_favorite(
    user_uuid UUID,
    event_uuid BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
    is_favorited BOOLEAN;
BEGIN
    -- Check if already favorited
    SELECT EXISTS(
        SELECT 1 FROM user_favorites 
        WHERE user_id = user_uuid AND event_id = event_uuid
    ) INTO is_favorited;
    
    IF is_favorited THEN
        -- Remove from favorites
        DELETE FROM user_favorites 
        WHERE user_id = user_uuid AND event_id = event_uuid;
        
        -- Decrement favorites count
        PERFORM decrement_event_favorites(event_uuid);
        
        RETURN false;
    ELSE
        -- Add to favorites
        INSERT INTO user_favorites (user_id, event_id) 
        VALUES (user_uuid, event_uuid)
        ON CONFLICT (user_id, event_id) DO NOTHING;
        
        -- Increment favorites count
        PERFORM increment_event_favorites(event_uuid);
        
        RETURN true;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record user interaction
CREATE OR REPLACE FUNCTION record_user_interaction(
    user_uuid UUID,
    event_uuid BIGINT,
    interaction_type_param TEXT,
    metadata_param JSONB DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
    INSERT INTO user_event_interactions (user_id, event_id, interaction_type, metadata)
    VALUES (user_uuid, event_uuid, interaction_type_param, metadata_param);
    
    -- Also increment the corresponding event stat
    CASE interaction_type_param
        WHEN 'view' THEN
            PERFORM increment_event_views(event_uuid);
        WHEN 'click' THEN
            PERFORM increment_event_clicks(event_uuid);
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create or update user profile
CREATE OR REPLACE FUNCTION upsert_user_profile(
    user_uuid UUID,
    full_name_param TEXT DEFAULT NULL,
    username_param TEXT DEFAULT NULL,
    avatar_url_param TEXT DEFAULT NULL,
    bio_param TEXT DEFAULT NULL,
    location_param TEXT DEFAULT NULL,
    location_lat_param DECIMAL DEFAULT NULL,
    location_lng_param DECIMAL DEFAULT NULL,
    preferences_param JSONB DEFAULT NULL
)
RETURNS user_profiles AS $$
DECLARE
    result user_profiles;
BEGIN
    INSERT INTO user_profiles (
        id, full_name, username, avatar_url, bio, location, 
        location_lat, location_lng, preferences
    )
    VALUES (
        user_uuid, full_name_param, username_param, avatar_url_param, 
        bio_param, location_param, location_lat_param, location_lng_param, 
        COALESCE(preferences_param, '{}'::jsonb)
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(full_name_param, user_profiles.full_name),
        username = COALESCE(username_param, user_profiles.username),
        avatar_url = COALESCE(avatar_url_param, user_profiles.avatar_url),
        bio = COALESCE(bio_param, user_profiles.bio),
        location = COALESCE(location_param, user_profiles.location),
        location_lat = COALESCE(location_lat_param, user_profiles.location_lat),
        location_lng = COALESCE(location_lng_param, user_profiles.location_lng),
        preferences = COALESCE(preferences_param, user_profiles.preferences),
        updated_at = NOW()
    RETURNING * INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;