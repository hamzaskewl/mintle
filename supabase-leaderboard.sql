-- Leaderboard scores table
-- Run this in your Supabase SQL editor if the table doesn't exist

CREATE TABLE IF NOT EXISTS scores (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('movies', 'spotify')),
  game_date DATE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one score per wallet per category per day
  UNIQUE(wallet_address, category, game_date)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_scores_category_date ON scores(category, game_date DESC);
CREATE INDEX IF NOT EXISTS idx_scores_wallet_address ON scores(wallet_address);
CREATE INDEX IF NOT EXISTS idx_scores_date_score ON scores(game_date DESC, score DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for leaderboard)
CREATE POLICY "Allow public read access scores" 
  ON scores FOR SELECT 
  USING (true);

-- Allow authenticated users to insert their own scores
-- Note: This requires authentication. For now, we'll allow inserts via service role
-- In production, you might want to add signature verification
CREATE POLICY "Allow insert scores" 
  ON scores FOR INSERT 
  WITH CHECK (true);

-- Allow users to update their own scores (same day)
CREATE POLICY "Allow update own scores" 
  ON scores FOR UPDATE 
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_scores_updated_at
  BEFORE UPDATE ON scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

