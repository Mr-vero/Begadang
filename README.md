# Begadang - FIFA World Cup 2026 Streaming App

**Begadang** (*Indonesian: staying up all night*) is a real-time FIFA World Cup 2026 companion app built for Indonesian fans watching late-night matches. Live scores, standings, knockout bracket, watch parties, match predictions, and broadcast schedule -- all in a single installable PWA.

![PWA](https://img.shields.io/badge/PWA-installable-blue) ![API](https://img.shields.io/badge/API-Football--Data.org-green) ![License](https://img.shields.io/badge/license-MIT-gray)

## Features

### Live Match Tracking
- **Real-time scores** from Football-Data.org API with 30-second auto-refresh during live matches
- **Team crests** -- actual SVG/PNG badges for all 48 nations, not emoji flags
- **Countdown timers** -- upcoming matches show "In 2h 14m" with live countdown
- **Goal alerts** -- detects score changes between refreshes and flashes a notification toast

### Full Tournament Coverage
- **104 matches** across 17 match days, organized by date with a horizontal day picker
- **All 12 groups** with live standings (played, goal difference, points)
- **Complete knockout bracket** -- Round of 32 through Final, with TBD placeholders that fill in as the tournament progresses
- **Match detail modal** -- tap any fixture for events timeline, lineups, and stats (where available from the API)

### Community Features
- **Watch parties** -- browse nobar events around Jambi City with venue, time, capacity, and live "going" count; tap to join
- **Predictions** -- pick match winners for upcoming fixtures, earn points, climb the local leaderboard
- **Broadcast schedule** -- tonight's TVRI/Indosiar/SCTV lineup at a glance

### Design
- **Liquid glass UI** inspired by iOS 26 -- radial specular highlights, frosted backdrop blur, spring physics animations
- **Dark cinematic gradient** background with animated color orbs
- **Retina-optimized** -- 0.5px borders, GPU-composited layers, optimizeLegibility text rendering
- **Safe area support** for notched iPhones (home indicator clearance)

### PWA
- **Installable** -- add to home screen on iOS and Android
- **Offline support** -- service worker caches the app shell and last-known API data
- **Standalone mode** -- runs without browser chrome, with dark status bar

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML/CSS/JS -- single `index.html`, no build step |
| Backend | Node.js + Express -- static file server + API caching proxy |
| Data | [Football-Data.org](https://www.football-data.org) free tier API |
| PWA | Web App Manifest + Service Worker |

## Architecture

```
Client (PWA)                    Server (Express)              Football-Data.org
    |                               |                               |
    |-- GET /api/matches ---------> |                               |
    |                               |-- cache hit? return cached    |
    |                               |-- cache miss? -------------> |
    |                               |<---- JSON response ----------|
    |                               |-- store in cache (30s-10m)   |
    |<----- JSON response ---------|                               |
    |                               |                               |
    |  (all users share cache)      |                               |
```

### Server-Side Caching

The Express server acts as a caching proxy so the API key stays server-side and all users share the same cached data:

| Endpoint | Upstream | Cache TTL |
|----------|----------|-----------|
| `GET /api/matches` | `/v4/competitions/WC/matches` | 30s during live matches, 10 min otherwise |
| `GET /api/standings` | `/v4/competitions/WC/standings` | 5 min |
| `GET /api/match/:id` | `/v4/matches/:id` | 30s if live, 5 min if finished |
| `GET /api/status` | -- | Health check (no upstream call) |

With 30s cache on live matches, the server makes at most ~2 requests/minute -- well under the free tier limit of 10 req/min.

### Service Worker Strategy

| Asset type | Strategy | Reason |
|-----------|----------|--------|
| App shell (HTML, icons, manifest) | Cache-first | Instant load on repeat visits |
| API responses (`/api/*`) | Network-first, cache fallback | Fresh data when online, last-known data when offline |
| External assets (fonts, crests) | Browser HTTP cache | Managed by CDN cache headers |

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- A free API key from [football-data.org](https://www.football-data.org/client/register) (takes 30 seconds, no credit card)

### Setup

```bash
# Clone the repo
git clone https://github.com/Mr-vero/Begadang.git
cd Begadang

# Install dependencies
npm install

# Add your API key
cp .env.example .env
# Edit .env and replace your_api_key_here with your key

# Start the server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Without an API Key

The app works without an API key -- it falls back to built-in sample data with a simulated live match. Set the key whenever you're ready for real data.

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FOOTBALL_DATA_API_KEY` | No | `your_api_key_here` | Free API key from football-data.org |
| `PORT` | No | `3000` | Server port |

## Project Structure

```
Begadang/
├── server.js              # Express server: static files + API proxy + cache
├── package.json           # npm start / npm run dev
├── .env                   # API key (not committed)
├── .env.example           # Template for .env
├── .gitignore
├── generate-icons.js      # One-time PWA icon generator (macOS)
├── begadang-worldcup.html # Original standalone prototype
└── public/
    ├── index.html         # The app (HTML + CSS + JS, single file)
    ├── manifest.json      # PWA manifest
    ├── sw.js              # Service worker
    └── icons/
        ├── icon-192.png   # PWA icon 192x192
        ├── icon-512.png   # PWA icon 512x512
        └── icon.svg       # Source SVG
```

## Development

```bash
# Start with auto-restart on changes
npm run dev

# Check API health
curl http://localhost:3000/api/status
```

The `dev` script uses `node --watch` to auto-restart the server when `server.js` changes. For frontend changes, just refresh the browser -- there's no build step.

## Deployment

The app is a standard Node.js server. Deploy to any platform that runs Node:

**Render / Railway / Fly.io:**
1. Connect your GitHub repo
2. Set `FOOTBALL_DATA_API_KEY` as an environment variable
3. Build command: `npm install`
4. Start command: `npm start`

**VPS / Docker:**
```bash
git clone https://github.com/Mr-vero/Begadang.git
cd Begadang && npm install
echo "FOOTBALL_DATA_API_KEY=your_key" > .env
PORT=8080 node server.js
```

## API Rate Limits

The Football-Data.org free tier allows 10 requests per minute. With server-side caching:

- **Normal browsing**: ~0.5 req/min (standings cached 5 min, fixtures cached 10 min)
- **During live matches**: ~2 req/min (fixtures refresh every 30s)
- **Many concurrent users**: Same rate -- all users share the server cache

You'll never hit the limit under normal use.

## Credits

- Match data: [Football-Data.org](https://www.football-data.org)
- Team crests: Football-Data.org CDN
- Design inspiration: iOS 26 Liquid Glass, FIFA+ app
- Built with Claude Code

## License

MIT
