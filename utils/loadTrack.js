const LOAD_TIMEOUT_MS = 10_000;

// High-performance track resolution memory cache
const trackCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL
const MAX_CACHE_SIZE = 500; // Max 500 entries to prevent unbounded growth

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of trackCache.entries()) {
    if (now - val.timestamp > CACHE_TTL_MS) {
      trackCache.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * Clean up oldest entries when cache exceeds max size
 */
function pruneCache() {
  if (trackCache.size <= MAX_CACHE_SIZE) return;

  const entries = Array.from(trackCache.entries());
  // Sort by timestamp, oldest first
  entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

  // Remove oldest 20%
  const toRemove = Math.ceil(entries.length * 0.2);
  for (let i = 0; i < toRemove; i++) {
    trackCache.delete(entries[i][0]);
  }
}

/**
 * Load a track from a Lavalink node with a timeout guard.
 */
async function loadTrack(node, identifier, timeoutMs = LOAD_TIMEOUT_MS) {
  const cached = trackCache.get(identifier);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    console.log(`[Cache Hit] Resolved: ${identifier}`);
    return cached.data;
  }

  const timeout = new Promise((_, rej) =>
    setTimeout(() => rej(new Error('Track load timed out')), timeoutMs)
  );

  const data = await Promise.race([
    node.rest.get(`/v4/loadtracks?identifier=${encodeURIComponent(identifier)}`),
    timeout,
  ]);

if (data && data.loadType !== 'error' && data.loadType !== 'empty') {
     pruneCache(); // Ensure we don't exceed max cache size
     trackCache.set(identifier, {
       data,
       timestamp: Date.now()
     });
   }

  return data;
}

/**
 * Clean up query by removing common fluff like [Official Video], (Lyrics), etc.
 * to improve search success rates on SoundCloud and Bandcamp.
 */
function cleanQuery(query) {
  if (!query || query.startsWith('http://') || query.startsWith('https://')) return query;
  return query
    .replace(/\s*[\[\(](?:official\s+video|official\s+audio|lyrics|lyric\s+video|official|hd|mv|audio|video|clip\s+officiel|4k|1080p)[\]\)]/gi, '')
    .replace(/\s*\|\s*.*$/gi, '') // Strip everything after pipe
    .replace(/\s*-\s*(?:lyrics|lyric|video|audio|official)$/gi, '')
    .trim();
}

/**
 * Search across multiple sources with automatic fallback.
 * Sources tried in order: SoundCloud -> Bandcamp -> YouTube.
 */
async function searchWithFallback(node, query, sources, attempt = 0) {
  if (attempt >= sources.length) return null;

  const source = sources[attempt];
  const cleaned = cleanQuery(query);
  console.log(`[Search] Trying ${source.name} with query: "${cleaned}"...`);

  try {
    const response = await loadTrack(node, `${source.prefix}${cleaned}`);
    if (response?.loadType === 'search' && response.data?.length > 0) {
      return { source: source.name, response };
    }
  } catch (err) {
    console.log(`[Search] ${source.name} error:`, err.message);
  }

  return searchWithFallback(node, query, sources, attempt + 1);
}

const DEFAULT_SEARCH_SOURCES = [
  { prefix: 'scsearch:', name: 'soundcloud' },
  { prefix: 'bcsearch:', name: 'bandcamp' },
  { prefix: 'ytsearch:', name: 'youtube' },
];

module.exports = {
  LOAD_TIMEOUT_MS,
  loadTrack,
  searchWithFallback,
  DEFAULT_SEARCH_SOURCES,
};
