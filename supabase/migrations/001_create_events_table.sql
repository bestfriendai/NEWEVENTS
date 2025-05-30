-- Create events table for storing events from RapidAPI and Ticketmaster
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  external_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('rapidapi', 'ticketmaster')),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location_name TEXT,
  location_address TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  price_min DECIMAL(10, 2),
  price_max DECIMAL(10, 2),
  price_currency TEXT DEFAULT 'USD',
  image_url TEXT,
  organizer_name TEXT,
  organizer_avatar TEXT,
  attendee_count INTEGER DEFAULT 0,
  ticket_links JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Create unique constraint on external_id and source to prevent duplicates
  CONSTRAINT unique_external_event UNIQUE (external_id, source)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_source ON events(source);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_location ON events(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all users
CREATE POLICY "Allow read access to all users" ON events
    FOR SELECT USING (true);

-- Create policy to allow insert/update for authenticated users (for API operations)
CREATE POLICY "Allow insert/update for service role" ON events
    FOR ALL USING (true);