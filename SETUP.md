# 🚀 MorL Setup Instructions

## System Overview (THE SMART WAY!)

### 🎬 Movies:
```
ONE-TIME SETUP:
  → Fetch ~1000 movies from TMDB:
    • Popular (400) - Mainstream hits
    • Top Rated (400) - Classics & high-rated
    • Now Playing (200) - Recent releases
  → NO rating filter - ALL ratings (4-10) for variety!
  → Get IMDB IDs
  → Store in movies_pool table
  → Done! (run once)

DAILY MIDNIGHT CRON:
  → Pick 6 random from pool (not yesterday's)
  → Fetch IMDB ratings from OMDB (only 6 API calls!)
  → Store in daily_games
  
USER PLAYS:
  → Pull from daily_games
  → Fast! Instant! 🚀
```

### 🎵 Spotify:
```
DAILY MIDNIGHT CRON:
  → Scrape kworb.net (top ~200 artists)
  → Shuffle with date seed
  → Pick 6 artists
  → Fetch images from Spotify API
  → Store in daily_games
  
USER PLAYS:
  → Pull from daily_games
  → Fast! Instant! 🚀
```

**Total API calls per day:**
- Movies: 6 OMDB requests (for IMDB ratings)
- Spotify: 6 Spotify API requests (for images)
- **Total: 12 requests/day!** (vs 2000+ before 😱)

---

## 📋 Setup Steps

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Create free account
3. Create new project
4. Wait ~2 minutes for setup

### 2. Run SQL Setup

In Supabase SQL Editor, run these files in order:

```bash
# a) Main schema (user stats, streaks, etc)
supabase-schema.sql

# b) Daily games table
supabase-daily-games.sql

# c) Movies pool table (NEW!)
supabase-movies-pool.sql
```

### 3. Get API Keys

**Supabase:**
- Settings → API → Copy:
  - `URL`
  - `anon public` key (use as SUPABASE_SERVICE_KEY)

**TMDB (one-time use):**
- https://www.themoviedb.org/settings/api
- Free: 10,000 requests/day
- Used once to populate movies

**OMDB (daily use):**
- https://www.omdbapi.com/apikey.aspx
- Free: 1,000 requests/day (we use 6/day!)
- Fetches IMDB ratings

**Spotify (daily use):**
- https://developer.spotify.com/dashboard
- Create app → Copy Client ID + Secret
- Fetches artist images

### 4. Create `.env.local`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key

# TMDB (one-time setup)
TMDB_API_KEY=your_tmdb_key

# OMDB (daily cron)
OMDB_API_KEY=your_omdb_key

# Spotify (daily cron)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Cron secret (make random)
CRON_SECRET=some-random-secret-123
```

### 5. Populate Movies Pool (ONE TIME!)

```bash
npm run populate-movies
```

**Takes ~10 minutes. You'll see:**
```
🎬 Fetching movies from multiple TMDB sources for MAXIMUM VARIETY!

📡 Fetching Popular Movies (20 pages)...
  ✅ Popular Movies - Page 1/20 (Total: 20)
  ...
  
📡 Fetching Top Rated (20 pages)...
📡 Fetching Now Playing (10 pages)...

✅ Total fetched: 1000 movies from all sources
   🎯 NO rating filter - all ratings included (4-10)!
   🔥 After deduplication: ~950 unique movies
🔍 Now fetching IMDB IDs...
  ✅ 1/1000: The Shawshank Redemption → tt0111161
  ...
💾 Storing 950 movies in database...
✨ Done!
```

**DO THIS ONCE - movies stay in DB forever!**

### 6. Test Daily Cron

```bash
npm run prepare-daily
```

**Should see:**
```
🎵 Preparing Spotify game for 2024-12-05
  Scraped 200 artists from kworb
  Selected 6 artists
  ✅ Stored 6 artists

🎬 Preparing Movies game for 2024-12-05
  Loaded 950 movies from pool
  Selected 6 movies
  Fetching IMDB rating: The Dark Knight
    Got rating: 9.0
  ...
  ✅ Stored 6 movies

✨ All games prepared!
```

### 7. Test the Game

```bash
npm run dev
```

Go to http://localhost:3000 and play!

---

## 🚀 Deploy to Production

### 1. Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push
```

### 2. Deploy on Vercel

1. Import GitHub repo
2. Add ALL environment variables from `.env.local`
3. Deploy

### 3. Populate Movies on Production

After first deploy, run the populate script:
```bash
# In Vercel dashboard, go to your project
# Functions → populate-movies → Deploy as API route
# Or SSH into production and run:
npm run populate-movies
```

### 4. Cron Activates Automatically!

Already configured in `vercel.json`:
- Runs daily at 4 AM UTC (11 PM EST)
- Hits: `/api/cron/prepare-daily`
- Prepares tomorrow's games

---

## ✅ Final System

**Movies:**
- Pool: 1000 popular movies (pre-populated, never fetch again!)
- Daily: Pick 6 → Fetch IMDB ratings (6 API calls)
- Users: Instant load from DB

**Spotify:**
- Daily: Scrape kworb → Pick 6 → Fetch images (6 API calls)
- Users: Instant load from DB

**Total daily API usage: 12 requests**
**User experience: INSTANT 🚀**

Perfect! 🎉
