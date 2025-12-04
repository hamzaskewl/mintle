-- Create table to store NFT metadata
-- This allows us to serve metadata via API endpoint
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS nft_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  results TEXT[] NOT NULL,
  streak INTEGER NOT NULL,
  perfect BOOLEAN NOT NULL,
  date TEXT NOT NULL,
  metadata JSONB NOT NULL, -- Full OpenSea-compatible metadata
  metadata_uri TEXT, -- IPFS hash if uploaded
  image_url TEXT,
  minted_at TIMESTAMP DEFAULT NOW(),
  minted_by TEXT, -- User wallet address
  tx_hash TEXT -- Transaction hash
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_nft_metadata_token_id ON nft_metadata(token_id);
CREATE INDEX IF NOT EXISTS idx_nft_metadata_minted_by ON nft_metadata(minted_by);

-- Enable RLS (Row Level Security)
ALTER TABLE nft_metadata ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for metadata endpoint)
CREATE POLICY "Allow public read access nft_metadata" 
  ON nft_metadata FOR SELECT 
  USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access nft_metadata" 
  ON nft_metadata 
  USING (true);

