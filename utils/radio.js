const { loadTrack } = require('./loadTrack');

const RADIO_SOURCES = [
  { prefix: 'scsearch:', name: 'soundcloud' },
  { prefix: 'bcsearch:', name: 'bandcamp' },
  { prefix: 'ytsearch:', name: 'youtube' },
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
];

async function searchRadioTrack(node, query) {
  for (const src of RADIO_SOURCES) {
    try {
      const res = await loadTrack(node, `${src.prefix}${query}`);
      if (res?.loadType === 'search' && res.data?.length > 0) {
        return res.data[Math.floor(Math.random() * Math.min(res.data.length, 5))];
      }
    } catch {}
  }
  return null;
}

/**
 * Load radio tracks into a player's queue.
 * Consolidates the duplicated radio-loading logic from queueEnd, playerStart,
 * trackError, interactionCreate, and the radio slash command.
 */
async function loadRadioTracks(client, player, count = 2) {
  if (player._radioLoading) return 0;
  player._radioLoading = true;

  if (player._radioGenreIndex === undefined || isNaN(player._radioGenreIndex)) {
    player._radioGenreIndex = 0;
  }

  let loaded = 0;
  let attempts = 0;
  const maxAttempts = count * 2;

  while (loaded < count && attempts < maxAttempts && player.radioMode) {
    const genre = RADIO_GENRES[player._radioGenreIndex % RADIO_GENRES.length];
    player._radioGenreIndex++;
    attempts++;

    try {
      const t = await searchRadioTrack(player.node, genre);
      if (t && player.radioMode) {
        player.queue.add({ track: t.encoded, info: t.info, requester: client.user });
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

module.exports = {
  RADIO_SOURCES,
  RADIO_GENRES,
  searchRadioTrack,
  loadRadioTracks,
};
