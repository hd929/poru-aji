const { loadTrack } = require('./loadTrack');

const RADIO_SOURCES = [
  { prefix: 'scsearch:', name: 'soundcloud' },
  { prefix: 'ytsearch:', name: 'youtube' },
  { prefix: 'bcsearch:', name: 'bandcamp' },
];

const RADIO_GENRES = [
  'chill beats instrumental',
  'lofi hip hop mix',
  'ambient electronic',
  'deep house chill',
  'indie acoustic cover',
  'jazz cafe background',
  'synthwave retro',
  'study music focus',
  'relaxing piano music',
  'night drive music',
  'tropical house mix',
  'future bass chill',
  'pop hits 2024',
  'hip hop beats',
  'acoustic songs',
  'electronic dance music',
  'k-pop playlist',
  'rock classics',
];

// Per-server genre preferences (persisted in memory, resets on restart)
const serverGenrePrefs = new Map();
const MAX_HISTORY = 50;

async function searchRadioTrack(node, query, history = []) {
  for (const src of RADIO_SOURCES) {
    try {
      const res = await loadTrack(node, `${src.prefix}${query}`);
      if (res?.loadType === 'search' && res.data?.length > 0) {
        // Filter out tracks already played
        const filtered = res.data.filter(t => {
          const title = t.info.title.toLowerCase();
          return !history.some(h => title.includes(h.toLowerCase()) || h.toLowerCase().includes(title));
        });
        const pool = filtered.length > 0 ? filtered : res.data;
        // Limit pool size to avoid memory bloat
        return pool[Math.floor(Math.random() * Math.min(pool.length, 8))];
      }
    } catch {}
  }
  return null;
}

/**
 * Load radio tracks into a player's queue.
 */
async function loadRadioTracks(client, player, count = 2) {
  if (player._radioLoading) return 0;
  player._radioLoading = true;

  if (player._radioGenreIndex === undefined || isNaN(player._radioGenreIndex)) {
    player._radioGenreIndex = 0;
  }

  // Initialize radio history with max size
  if (!player._radioHistory) {
    player._radioHistory = [];
  }

  let loaded = 0;
  let attempts = 0;
  const maxAttempts = count * 5;

  while (loaded < count && attempts < maxAttempts && player.radioMode) {
    // Use per-server genre bias if available, otherwise random
    const guildId = player.guildId;
    const genres = RADIO_GENRES; // Could use per-server preferences here
    const genre = genres[player._radioGenreIndex % genres.length];
    player._radioGenreIndex++;
    attempts++;

    try {
      const t = await searchRadioTrack(player.node, genre, player._radioHistory);
      if (t && player.radioMode) {
        player.queue.add({ track: t.encoded, info: t.info, requester: client.user });
        // Add to history, keep max size
        player._radioHistory.push(t.info.title);
        if (player._radioHistory.length > MAX_HISTORY) {
          player._radioHistory.shift();
        }
        loaded++;
      }
    } catch (err) {
      console.error('[Radio load] Error:', err.message);
    }
  }

  console.log(`[Radio] Loaded ${loaded} tracks. Queue: ${player.queue.length}`);
  player._radioLoading = false;
  return loaded;
}

// Clean up function for memory management
function cleanupRadioHistory(player) {
  if (player._radioHistory && player._radioHistory.length > MAX_HISTORY) {
    player._radioHistory = player._radioHistory.slice(-MAX_HISTORY);
  }
}

module.exports = {
  RADIO_SOURCES,
  RADIO_GENRES,
  searchRadioTrack,
  loadRadioTracks,
  cleanupRadioHistory,
};
