-- MorL Database Schema for Supabase
-- Run this in your Supabase SQL editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Artists table (Spotify data from kworb.net)
CREATE TABLE IF NOT EXISTS artists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  spotify_id VARCHAR(50),
  listeners BIGINT NOT NULL,
  daily_change INTEGER,
  peak_rank INTEGER,
  peak_listeners BIGINT,
  image_url TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_artists_listeners ON artists(listeners DESC);
CREATE INDEX IF NOT EXISTS idx_artists_name ON artists(name);

-- Movies table (cached OMDB data)
CREATE TABLE IF NOT EXISTS movies (
  imdb_id VARCHAR(20) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  year INTEGER,
  rating DECIMAL(3,1) NOT NULL,
  poster_url TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_movies_rating ON movies(rating DESC);

-- User scores
CREATE TABLE IF NOT EXISTS scores (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  category VARCHAR(20) NOT NULL,
  game_date DATE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one score per wallet per category per day
  UNIQUE(wallet_address, category, game_date)
);

-- Indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_scores_date ON scores(game_date DESC);
CREATE INDEX IF NOT EXISTS idx_scores_wallet ON scores(wallet_address);
CREATE INDEX IF NOT EXISTS idx_scores_category ON scores(category);

-- User streaks (optional, can be calculated from scores)
CREATE TABLE IF NOT EXISTS user_streaks (
  wallet_address VARCHAR(42) PRIMARY KEY,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_played DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily leaderboard view
CREATE OR REPLACE VIEW daily_leaderboard AS
SELECT 
  wallet_address,
  SUM(score) as total_score,
  COUNT(*) as games_played,
  MAX(score) as best_score,
  game_date
FROM scores
WHERE game_date = CURRENT_DATE
GROUP BY wallet_address, game_date
ORDER BY total_score DESC;

-- All-time leaderboard view
CREATE OR REPLACE VIEW alltime_leaderboard AS
SELECT 
  s.wallet_address,
  SUM(s.score) as total_score,
  COUNT(*) as games_played,
  MAX(s.score) as best_score,
  COALESCE(u.current_streak, 0) as current_streak,
  COALESCE(u.best_streak, 0) as best_streak
FROM scores s
LEFT JOIN user_streaks u ON s.wallet_address = u.wallet_address
GROUP BY s.wallet_address, u.current_streak, u.best_streak
ORDER BY total_score DESC;

-- Function to update streak on score insert
CREATE OR REPLACE FUNCTION update_streak()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_streaks (wallet_address, current_streak, best_streak, last_played)
  VALUES (NEW.wallet_address, 1, 1, NEW.game_date)
  ON CONFLICT (wallet_address) 
  DO UPDATE SET
    current_streak = CASE 
      WHEN user_streaks.last_played = NEW.game_date - INTERVAL '1 day' 
      THEN user_streaks.current_streak + 1
      WHEN user_streaks.last_played = NEW.game_date
      THEN user_streaks.current_streak
      ELSE 1
    END,
    best_streak = GREATEST(
      user_streaks.best_streak,
      CASE 
        WHEN user_streaks.last_played = NEW.game_date - INTERVAL '1 day' 
        THEN user_streaks.current_streak + 1
        WHEN user_streaks.last_played = NEW.game_date
        THEN user_streaks.current_streak
        ELSE 1
      END
    ),
    last_played = NEW.game_date,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update streaks
DROP TRIGGER IF EXISTS trigger_update_streak ON scores;
CREATE TRIGGER trigger_update_streak
AFTER INSERT ON scores
FOR EACH ROW
EXECUTE FUNCTION update_streak();

-- RLS Policies (Row Level Security)
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read scores (for leaderboard)
CREATE POLICY "Scores are viewable by everyone" 
ON scores FOR SELECT 
USING (true);

-- Allow authenticated users to insert their own scores
CREATE POLICY "Users can insert their own scores" 
ON scores FOR INSERT 
WITH CHECK (true); -- In production, verify wallet_address matches authenticated user

-- Artists and movies are public read
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Artists are viewable by everyone" 
ON artists FOR SELECT 
USING (true);

ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Movies are viewable by everyone" 
ON movies FOR SELECT 
USING (true);

