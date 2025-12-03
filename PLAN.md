# MorL - Daily More or Less Game

## 🎯 Overview

A daily "Higher or Lower" guessing game as a **Base Mini App** with wallet-connected leaderboards.

**Categories:**
1. 🎬 **Movies** - IMDB Ratings (OMDB API)
2. 🎵 **Spotify** - Monthly Listeners (scraped from kworb.net)
3. 📈 **Crypto** - Market Cap / Price (TBD - CoinGecko?)

**Core Mechanics:**
- 5 comparisons per category per day
- Game ends on first wrong answer (0-5 score)
- Same puzzles for everyone daily (seeded randomization)
- Resets at **12:00 AM EST**
- Scores persist via wallet address (.eth support)

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| **Framework** | Next.js 14 (App Router) | Base Mini App recommended stack |
| **Styling** | Tailwind CSS | Dark theme, animations |
| **Web3** | OnchainKit + Wagmi | Base Mini App SDK |
| **Auth** | Farcaster/Wallet Connect | User identity via .eth |
| **Database** | Supabase (PostgreSQL) | Leaderboards, game data |
| **Scraping** | Cheerio + Node fetch | kworb.net daily sync |

---

## 🎨 Design System

### Color Palette (Dark Blue + Black)

```css
:root {
  /* Background layers */
  --bg-primary: #0a0a0f;      /* Near black */
  --bg-secondary: #12121a;    /* Dark navy */
  --bg-card: #1a1a2e;         /* Card surfaces */
  
  /* Accent colors */
  --accent-blue: #3b82f6;     /* Primary blue */
  --accent-cyan: #06b6d4;     /* Highlight cyan */
  --accent-purple: #8b5cf6;   /* Secondary accent */
  
  /* Status colors */
  --success: #10b981;         /* Correct answer */
  --error: #ef4444;           /* Wrong answer */
  
  /* Text */
  --text-primary: #f8fafc;    /* White text */
  --text-secondary: #94a3b8;  /* Muted text */
  --text-accent: #60a5fa;     /* Link/highlight */
}
```

### Typography
- **Headings**: Space Grotesk or Outfit (modern, geometric)
- **Body**: Inter or system-ui
- **Numbers**: JetBrains Mono (for stats/scores)

### Visual Style
- Glassmorphism cards with subtle blur
- Gradient borders on active elements
- Smooth micro-animations
- Subtle grid/dot pattern background
- Glow effects on interactive elements

---

## 📁 Project Structure

```
MorL/
├── app/
│   ├── page.tsx                    # Home - category selection
│   ├── layout.tsx                  # Root layout + providers
│   ├── play/
│   │   ├── movies/page.tsx         # IMDB game
│   │   ├── spotify/page.tsx        # Spotify listeners game
│   │   └── crypto/page.tsx         # Crypto market cap game
│   ├── leaderboard/page.tsx        # Global leaderboard
│   └── api/
│       ├── daily/[category]/route.ts  # Get today's game
│       ├── submit/route.ts            # Submit score
│       ├── leaderboard/route.ts       # Get rankings
│       └── cron/
│           ├── sync-spotify/route.ts  # Daily kworb scrape
│           └── sync-movies/route.ts   # Refresh movie data
│
├── components/
│   ├── ui/                         # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   └── Skeleton.tsx
│   ├── game/
│   │   ├── GameCard.tsx            # Display item (poster/artist)
│   │   ├── CompareButtons.tsx      # Higher/Lower buttons
│   │   ├── ScoreIndicator.tsx      # Progress dots
│   │   ├── ResultReveal.tsx        # Animated value reveal
│   │   └── GameOver.tsx            # Final score + share
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── WalletConnect.tsx
│   └── providers/
│       ├── Web3Provider.tsx        # Wagmi + OnchainKit
│       └── GameProvider.tsx        # Game state context
│
├── lib/
│   ├── api/
│   │   ├── omdb.ts                 # OMDB API client
│   │   ├── kworb-scraper.ts        # Spotify data scraper
│   │   └── coingecko.ts            # Crypto data (TBD)
│   ├── game/
│   │   ├── daily-seed.ts           # Deterministic daily seed
│   │   ├── shuffle.ts              # Seeded array shuffle
│   │   └── game-logic.ts           # Core game mechanics
│   ├── db/
│   │   ├── supabase.ts             # Supabase client
│   │   └── queries.ts              # Database queries
│   └── utils/
│       ├── format.ts               # Number formatting
│       └── time.ts                 # EST time helpers
│
├── data/
│   ├── movies.json                 # Curated IMDB IDs (~200+)
│   └── README.md                   # Data source notes
│
├── public/
│   └── images/                     # Static assets
│
├── .env.local                      # API keys (gitignored)
├── .env.example                    # Template for env vars
├── tailwind.config.ts
├── next.config.js
├── package.json
└── README.md
```

---

## 🔌 API Integrations

### 1. OMDB API (Movies)

**Endpoint:** `https://www.omdbapi.com/`

```typescript
// Example request
const response = await fetch(
  `https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_API_KEY}`
);

// Response structure we need
interface MovieData {
  Title: string;
  Year: string;
  imdbRating: string;  // "8.1"
  Poster: string;      // Image URL
  imdbID: string;      // "tt0070047"
}
```

**Strategy:**
- Curate list of ~200+ popular movies with IMDB IDs
- Cache movie data in Supabase (ratings don't change much)
- Refresh weekly via cron job

**Movies List (partial - we'll expand):**
```json
[
  {"id": "tt0111161", "title": "The Shawshank Redemption"},
  {"id": "tt0068646", "title": "The Godfather"},
  {"id": "tt0468569", "title": "The Dark Knight"},
  {"id": "tt0108052", "title": "Schindler's List"},
  {"id": "tt0167260", "title": "The Lord of the Rings: The Return of the King"},
  // ... 200+ more
]
```

---

### 2. Kworb.net Scraping (Spotify)

**Source:** https://kworb.net/spotify/listeners.html

**HTML Structure:**
```html
<table>
  <tr>
    <td>1</td>
    <td><a href="...">The Weeknd</a></td>
    <td>120,502,376</td>
    <td>-162,758</td>
    <td>1</td>
    <td>126,192,069</td>
  </tr>
</table>
```

**Scraping Strategy:**
```typescript
// lib/api/kworb-scraper.ts
import * as cheerio from 'cheerio';

interface SpotifyArtist {
  rank: number;
  name: string;
  listeners: number;
  dailyChange: number;
  peak: number;
  peakListeners: number;
}

export async function scrapeSpotifyListeners(): Promise<SpotifyArtist[]> {
  const response = await fetch('https://kworb.net/spotify/listeners.html');
  const html = await response.text();
  const $ = cheerio.load(html);
  
  const artists: SpotifyArtist[] = [];
  
  $('table tbody tr').each((i, row) => {
    const cells = $(row).find('td');
    artists.push({
      rank: parseInt($(cells[0]).text()),
      name: $(cells[1]).text().trim(),
      listeners: parseInt($(cells[2]).text().replace(/,/g, '')),
      dailyChange: parseInt($(cells[3]).text().replace(/,/g, '')),
      peak: parseInt($(cells[4]).text()),
      peakListeners: parseInt($(cells[5]).text().replace(/,/g, '')),
    });
  });
  
  return artists;
}
```

**Sync Schedule:**
- Daily cron at 11:00 PM EST (1 hour before reset)
- Store top 500 artists in Supabase
- Keep historical data for stats

---

### 3. Crypto Data (Category 3 - TBD)

**Likely API:** CoinGecko (free tier available)

**Potential game modes:**
- Guess which coin has higher market cap
- Guess which coin gained more % today
- Guess the 24h volume comparison

---

## 🎲 Game Logic

### Daily Seed Generation

```typescript
// lib/game/daily-seed.ts
export function getDailySeed(): string {
  // Get current time in EST
  const now = new Date();
  const estOffset = -5 * 60; // EST is UTC-5
  const estTime = new Date(now.getTime() + estOffset * 60 * 1000);
  
  // Format as YYYY-MM-DD
  const year = estTime.getUTCFullYear();
  const month = String(estTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(estTime.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// Seeded random number generator
export function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  
  return function() {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return hash / 0x7fffffff;
  };
}

// Shuffle array with seed
export function seededShuffle<T>(array: T[], seed: string): T[] {
  const rng = seededRandom(seed);
  const shuffled = [...array];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}
```

### Daily Game Generation

```typescript
// lib/game/game-logic.ts
interface GameItem {
  id: string;
  name: string;
  value: number;      // Rating, listeners, market cap
  imageUrl: string;
}

interface DailyGame {
  category: 'movies' | 'spotify' | 'crypto';
  date: string;       // YYYY-MM-DD
  items: GameItem[];  // 6 items = 5 comparisons
}

export function generateDailyGame(
  category: string,
  allItems: GameItem[],
  seed: string
): DailyGame {
  // Combine seed with category for unique game per category
  const gameSeed = `${seed}-${category}`;
  
  // Shuffle and take first 6 items
  const shuffled = seededShuffle(allItems, gameSeed);
  const selectedItems = shuffled.slice(0, 6);
  
  return {
    category,
    date: seed,
    items: selectedItems,
  };
}
```

---

## 💾 Database Schema (Supabase)

```sql
-- Artists table (Spotify data)
CREATE TABLE artists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  listeners BIGINT NOT NULL,
  daily_change INTEGER,
  peak_rank INTEGER,
  peak_listeners BIGINT,
  image_url TEXT,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Movies table (cached OMDB data)
CREATE TABLE movies (
  imdb_id VARCHAR(20) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  year INTEGER,
  rating DECIMAL(3,1) NOT NULL,
  poster_url TEXT,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- User scores
CREATE TABLE scores (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  category VARCHAR(20) NOT NULL,
  game_date DATE NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(wallet_address, category, game_date)
);

-- Daily leaderboard view
CREATE VIEW daily_leaderboard AS
SELECT 
  wallet_address,
  SUM(score) as total_score,
  COUNT(*) as games_played,
  MAX(score) as best_score
FROM scores
WHERE game_date = CURRENT_DATE
GROUP BY wallet_address
ORDER BY total_score DESC;
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation ✅
- [x] Project plan
- [x] Next.js setup with Tailwind
- [x] Dark theme + design system
- [x] Basic layout components
- [x] Environment variables setup

### Phase 2: Movies Game ✅
- [x] OMDB API integration
- [x] Curate movie list (150+ titles)
- [x] Game card component
- [x] Higher/Lower UI
- [x] Score tracking
- [x] Game over screen

### Phase 3: Spotify Game ✅
- [x] Kworb scraper implementation
- [x] Artist data (100+ artists)
- [x] Daily sync cron job
- [x] Spotify game page

### Phase 4: Database + Leaderboards ✅
- [x] Supabase schema
- [x] Score submission structure
- [x] Leaderboard page (mock data)
- [x] Streak tracking
- [x] Share results feature

### Phase 5: Polish ✅
- [x] Animations (Framer Motion)
- [x] Mobile responsive
- [x] Error handling
- [x] Loading states

### Next Steps (Future)
- [ ] Wallet connection (OnchainKit)
- [ ] Connect Supabase live
- [ ] Base Mini App manifest
- [ ] Crypto category
- [ ] Real leaderboard data

---

## 🔧 Environment Variables

```env
# .env.local
OMDB_API_KEY=bf299ec4
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_key
```

---

## 📱 Base Mini App Manifest

```json
{
  "name": "MorL",
  "description": "Daily More or Less guessing game",
  "homeUrl": "https://morl.app",
  "imageUrl": "https://morl.app/og-image.png",
  "splashImageUrl": "https://morl.app/splash.png",
  "splashBackgroundColor": "#0a0a0f",
  "webhookUrl": "https://morl.app/api/webhook"
}
```

---

## 📋 Questions to Confirm

1. **Domain**: Do you have a domain in mind? (morl.xyz, morl.app, etc.)

2. **Crypto Category Details**: 
   - Compare market cap?
   - Compare 24h price change %?
   - Compare trading volume?

3. **Leaderboard Scope**:
   - Daily only?
   - Weekly/Monthly/All-time?

4. **Additional Features**:
   - Streak tracking (consecutive days played)?
   - Share to Farcaster integration?

---

Ready to start building Phase 1 when you are! 🚀

