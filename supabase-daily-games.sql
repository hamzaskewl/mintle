-- Daily prepared games table
-- Stores the 5 items for each category, refreshed daily

CREATE TABLE IF NOT EXISTS daily_games (
  id SERIAL PRIMARY KEY,
  category VARCHAR(20) NOT NULL,
  game_date DATE NOT NULL,
  position INTEGER NOT NULL, -- 1-6 for the 6 items needed (5 rounds)
  
  -- Common fields
  name VARCHAR(255) NOT NULL,
  image_url TEXT,
  
  -- Category-specific fields
  value DECIMAL NOT NULL, -- rating for movies, listeners for spotify
  external_id VARCHAR(100), -- imdb_id or spotify_id
  subtitle VARCHAR(100), -- year for movies, etc
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(category, game_date, position)
);

-- Index for fast daily lookups
CREATE INDEX IF NOT EXISTS idx_daily_games_lookup 
ON daily_games(category, game_date);

-- RLS: Public read access
ALTER TABLE daily_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily games are viewable by everyone" 
ON daily_games FOR SELECT 
USING (true);

-- Allow service role to insert/update
CREATE POLICY "Service role can manage daily games" 
ON daily_games FOR ALL 
USING (true);

-- Table to track previously used items (avoid repeats)
CREATE TABLE IF NOT EXISTS used_items (
  id SERIAL PRIMARY KEY,
  category VARCHAR(20) NOT NULL,
  external_id VARCHAR(100) NOT NULL,
  last_used DATE NOT NULL,
  
  UNIQUE(category, external_id)
);

CREATE INDEX IF NOT EXISTS idx_used_items_lookup 
ON used_items(category, last_used);

