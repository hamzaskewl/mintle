# Mintle – Daily More or Less on Base

Mintle is a daily “higher or lower” game that runs as a Base Mini App. Players compare IMDB movie ratings and Spotify monthly listeners, build streaks, mint on-chain NFTs of their results, and compete on a global leaderboard.

---

## Features

- **Movies** – Guess which movie has the higher IMDB rating.  
- **Spotify** – Guess which artist has more monthly listeners.  
- **Shared daily seed** – Everyone sees the same puzzles each day, then they reset.  
- **Streaks and next reset timer** – Track your current and best streak and see when the next day unlocks.  
- **On-chain NFTs on Base**  
  - Mint a unique ERC‑721 NFT of your game result.  
  - Custom metadata: category, score, total, streak, and result pattern.  
  - Dynamic image generated at mint time via an OG-style API route.  
- **Base Mini App native flow**  
  - Uses the Base Account via the Farcaster Mini App SDK and Wagmi connector.  
  - Transactions and approvals show in the Base / Warpcast UI instead of a browser wallet.  
  - Supports sponsored (gasless) transactions via paymaster.  
- **Leaderboard**  
  - Stores scores per wallet, category, and day in Supabase.  
  - Shows rank, score, and current streak.  
  - Highlights the current user based on their Base Account address.  

---

## Tech Stack

- **Languages**: TypeScript, Solidity  
- **Frameworks**: Next.js (App Router), React  
- **Styling and UX**: Tailwind CSS, Framer Motion  
- **Web3 / Base**:  
  - Base (Base Sepolia for testing)  
  - ERC‑721 contract (`MintleNFT`)  
  - `viem` for contract interaction  
  - `wagmi` with `@farcaster/miniapp-wagmi-connector` for the Base Account  
  - Paymaster integration for account abstraction and gasless flows  
- **Backend and APIs**:  
  - Next.js API routes (`/api/nft/*`, `/api/og`, `/api/leaderboard`, `/api/scores`, `/api/webhook`)  
  - `@vercel/og` for dynamic result images  
  - OMDB and scraping for movies and Spotify data  
- **Data and Storage**: Supabase (Postgres) for artists, movies, scores, and NFT metadata  
- **Hosting**: Vercel, with the Base Mini App manifest served from `public/.well-known/farcaster.json`  

---

## Getting Started

### Prerequisites

- Node.js 18+  
- npm or pnpm  
- Supabase project (Postgres)  
- OMDB API key (get one at [omdbapi.com](https://www.omdbapi.com/apikey.aspx))  

### Installation

```bash
git clone <your-repo-url>
cd <project-folder>

npm install
# or
pnpm install
```

### Environment variables

Create a `.env.local` file in the project root:

```bash
OMDB_API_KEY=your_omdb_api_key

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Optional: any RPC or paymaster URLs you use
# BASE_RPC_URL=...
# PAYMASTER_URL=...
```

---

## Database Setup (Supabase)

In the Supabase SQL editor:

1. Create or import your artists and movies tables used by the game content.  
2. Create an `nft_metadata` table for storing NFT metadata (token id, metadata JSON, image URL, minter, tx hash).  
3. Create a `scores` table for the leaderboard, for example:

```sql
CREATE TABLE IF NOT EXISTS scores (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('movies', 'spotify')),
  game_date DATE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (wallet_address, category, game_date)
);
```

4. Add Row Level Security (RLS) policies that allow public `SELECT` for reading leaderboard data and inserts/updates via your service key for writes.  

---

## Running the App Locally

```bash
npm run dev
# or
pnpm dev
```

Then open `http://localhost:3000` in your browser.

On web, the app behaves like a normal Next.js site. Inside Base / Warpcast, the same code uses the Base Account connector and mini app SDK so transactions and mints happen natively in the mini app.

---

## How to Play

1. Open Mintle (web or Base Mini App).  
2. Choose a category: Movies (IMDB) or Spotify (listeners).  
3. For each round, see item A’s value and guess whether item B is higher or lower.  
4. You get up to 5 comparisons per day; once you miss, the run is over.  
5. Your score and streak update, and you can optionally mint an NFT of the result and share it.  
6. New puzzles unlock daily, using a shared daily seed so everyone plays the same challenge.  

---

## Base Mini App Integration

- Manifest hosted at `/.well-known/farcaster.json` with app metadata, icons, splash, and images.  
- `BaseMiniAppBootstrap` component initializes the Farcaster Mini App SDK and wraps the app in a Wagmi provider configured for Base/Base Sepolia.  
- NFT minting uses the Base Account via `sendCalls`, and can be sponsored with a paymaster for gasless UX.  
- A webhook endpoint (`/api/webhook`) is available for future event integrations from Base.  

---

## Contributing and License

The project is MIT-licensed. You can fork it, change the categories or visuals, or reuse the NFT + leaderboard stack for your own Base Mini App. If you add improvements or fix issues, feel free to open a pull request.***