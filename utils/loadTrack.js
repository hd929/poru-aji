const LOAD_TIMEOUT_MS = 10_000;

// High-performance track resolution memory cache
const trackCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of trackCache.entries()) {
    if (now - val.timestamp > CACHE_TTL_MS) {
      trackCache.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * Load a track from a Lavalink node with a timeout guard.
 * Centralizes the duplicated Promise.race + timeout pattern used across
 * play.js, radio.js, interactionCreate.js, queueEnd.js, and trackError.js.
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
    trackCache.set(identifier, {
      data,
      timestamp: Date.now()
    });
  }

  return data;
}

/**
 * Search across multiple sources with automatic fallback.
 * Sources tried in order: SoundCloud -> Bandcamp -> YouTube.
 */
async function searchWithFallback(node, query, sources, attempt = 0) {
  if (attempt >= sources.length) return null;

  const source = sources[attempt];
  console.log(`[Search] Trying ${source.name}...`);

  try {
    const response = await loadTrack(node, `${source.prefix}${query}`);
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
