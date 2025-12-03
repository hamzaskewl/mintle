# Database Schema Setup

## Step 1: Add spotify_id column

Run in Supabase SQL Editor:

```sql
ALTER TABLE artists ADD COLUMN IF NOT EXISTS spotify_id VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_artists_spotify_id ON artists(spotify_id);
```

## Step 2: Create daily_games tables

Copy and paste the entire `supabase-daily-games.sql` file into Supabase SQL Editor and run it.

This creates:
- `daily_games` table - stores 6 prepared items per category per day
- `used_items` table - tracks what was used to avoid repeats

## Step 3: Populate fallback data

```bash
npm run fetch-spotify-images
```

This fills your `artists` table with fallback data (only runs once).

## Step 4: Test daily preparation

```bash
npm run prepare-daily
```

This will:
- Scrape kworb.net for current top artists
- Pick 5 random (excluding recent)
- Fetch Spotify images
- Store for tomorrow's game
- Same for movies from OMDB

## How It Works

**11 PM EST daily** (automated cron):
1. Scrape fresh data from kworb.net
2. Pick 5 random items (avoiding last 30 days)
3. Fetch images from Spotify/OMDB
4. Store in `daily_games` table

**Game API**:
1. Check `daily_games` first (fresh, random)
2. Fallback to `artists`/`movies` table if needed

✅ Fresh random content daily  
✅ No repeats for 30 days  
✅ Fallback if scraping fails

