require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const API_BASE = 'https://api.football-data.org/v4';
const COMP = 'WC';

// --------------- in-memory cache ---------------
const cache = new Map();

function cached(key, ttlMs) {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expires) return entry.data;
  return null;
}

function store(key, data, ttlMs) {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

// --------------- upstream fetch helper ---------------
async function apiFetch(endpoint) {
  const headers = { 'X-Auth-Token': API_KEY };
  const res = await fetch(`${API_BASE}${endpoint}`, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Football-Data API ${res.status}: ${text}`);
  }
  return res.json();
}

// --------------- static files ---------------
app.use(express.static(path.join(__dirname, 'public')));

// --------------- API health check ---------------
app.get('/api/status', (_req, res) => {
  const hasKey = API_KEY && API_KEY !== 'your_api_key_here';
  res.json({
    api: hasKey ? 'configured' : 'no_key',
    cache_entries: cache.size,
    uptime: process.uptime(),
  });
});

// --------------- GET /api/matches ---------------
app.get('/api/matches', async (req, res) => {
  try {
    const matchday = req.query.matchday;
    const dateFrom = req.query.dateFrom;
    const dateTo = req.query.dateTo;

    let qs = '';
    if (matchday) qs += `&matchday=${matchday}`;
    if (dateFrom) qs += `&dateFrom=${dateFrom}`;
    if (dateTo) qs += `&dateTo=${dateTo}`;

    const cacheKey = `matches:${qs}`;
    const hit = cached(cacheKey);
    if (hit) return res.json(hit);

    const data = await apiFetch(`/competitions/${COMP}/matches?${qs}`);

    const hasLive = data.matches?.some(m =>
      m.status === 'IN_PLAY' || m.status === 'PAUSED' || m.status === 'HALFTIME'
    );
    const ttl = hasLive ? 30_000 : 600_000;
    store(cacheKey, data, ttl);

    res.json(data);
  } catch (err) {
    console.error('[/api/matches]', err.message);
    res.status(502).json({ error: err.message });
  }
});

// --------------- GET /api/standings ---------------
app.get('/api/standings', async (_req, res) => {
  try {
    const cacheKey = 'standings';
    const hit = cached(cacheKey);
    if (hit) return res.json(hit);

    const data = await apiFetch(`/competitions/${COMP}/standings`);
    store(cacheKey, data, 300_000);
    res.json(data);
  } catch (err) {
    console.error('[/api/standings]', err.message);
    res.status(502).json({ error: err.message });
  }
});

// --------------- GET /api/match/:id ---------------
app.get('/api/match/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const cacheKey = `match:${id}`;
    const hit = cached(cacheKey);
    if (hit) return res.json(hit);

    const data = await apiFetch(`/matches/${id}`);
    const isLive = ['IN_PLAY', 'PAUSED', 'HALFTIME'].includes(data.status);
    store(cacheKey, data, isLive ? 30_000 : 300_000);
    res.json(data);
  } catch (err) {
    console.error(`[/api/match/${req.params.id}]`, err.message);
    res.status(502).json({ error: err.message });
  }
});

// --------------- SPA fallback ---------------
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  const hasKey = API_KEY && API_KEY !== 'your_api_key_here';
  console.log(`\n  Begadang World Cup 2026`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  API key: ${hasKey ? 'configured' : 'NOT SET — using sample data'}`);
  console.log(`  Get a free key: https://www.football-data.org/client/register\n`);
});
