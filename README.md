# 🎮 MorL - Daily More or Less Game

A daily "Higher or Lower" guessing game built as a Base Mini App. Compare IMDB movie ratings and Spotify monthly listeners in this addictive daily challenge!

![MorL Preview](https://via.placeholder.com/800x400/0a0a0f/3b82f6?text=MorL+-+Daily+More+or+Less)

## 🎯 Features

- **🎬 Movies** - Guess IMDB ratings for popular films
- **🎵 Spotify** - Guess monthly listener counts for top artists
- **📊 Daily Challenges** - Same puzzles for everyone, resets at midnight EST
- **🔥 Streak Tracking** - Build your streak by playing daily
- **🏆 Leaderboards** - Compete with other players
- **💼 Wallet Integration** - Coming soon with Base Mini App SDK

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OMDB API key (get free at [omdbapi.com](https://www.omdbapi.com/apikey.aspx))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/morl.git
cd morl
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
# Create .env.local with your API keys
OMDB_API_KEY=your_omdb_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## 🏗️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State**: Zustand
- **Database**: Supabase (PostgreSQL)
- **APIs**: OMDB, kworb.net scraping

## 📁 Project Structure

```
MorL/
├── app/
│   ├── page.tsx              # Home - category selection
│   ├── play/
│   │   ├── movies/page.tsx   # Movies game
│   │   └── spotify/page.tsx  # Spotify game
│   ├── leaderboard/page.tsx  # Leaderboard
│   └── api/
│       └── daily/            # Daily game endpoints
├── components/
│   ├── ui/                   # Reusable UI components
│   └── game/                 # Game-specific components
├── lib/
│   ├── api/                  # API integrations
│   ├── game/                 # Game logic
│   └── db/                   # Database utilities
└── data/                     # Static data files
```

## 🎮 How to Play

1. **Choose a category** - Movies (IMDB) or Spotify (Listeners)
2. **Compare values** - See item A's value, guess if item B is higher or lower
3. **Get it right** - Correct = next round, Wrong = game over
4. **Score 5/5** - Get all 5 comparisons correct for a perfect score
5. **Come back tomorrow** - New puzzles daily at midnight EST

## 🗄️ Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the schema from `supabase-schema.sql` in the SQL editor
3. Add your Supabase credentials to `.env.local`

## 🔄 Data Syncing

### Spotify Data
The app scrapes [kworb.net](https://kworb.net/spotify/listeners.html) for Spotify monthly listener data. For production:

1. Set up a Vercel cron job in `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/sync-spotify",
    "schedule": "0 4 * * *"
  }]
}
```

### Movie Data
OMDB API is called on-demand. Movie ratings are cached in Supabase for performance.

## 🎨 Design

- **Theme**: Dark mode with blue/cyan accents
- **Colors**: 
  - Background: `#0a0a0f` (near black)
  - Cards: `#1a1a2e` (dark navy)
  - Accent: `#3b82f6` (blue), `#06b6d4` (cyan)
- **Font**: Outfit (headings), JetBrains Mono (numbers)

## 📱 Base Mini App

This app is designed to work as a Base Mini App. See [Base Mini App docs](https://docs.base.org/mini-apps) for deployment instructions.

## 📝 License

MIT License - feel free to use this for your own projects!

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

Built with 💙 for the Base ecosystem

