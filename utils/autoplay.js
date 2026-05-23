const { getTopTracksForGuild } = require('./db');
const { recommendSongs } = require('./ai');
const { loadTrack } = require('./loadTrack');

/**
 * Load an autoplay track based on server history and AI recommendations.
 * Consolidates the identical logic from interactionCreate.js and queueEnd.js.
 *
 * Returns a track data object ({ encoded, info }) or null.
 */
async function loadAutoplayTrack(client, player) {
  const topTracks = await getTopTracksForGuild(player.guildId, 20);
  let recommendations = [];

  // 1. Try AI recommendations if enough history exists
  if (topTracks.length >= 3) {
    try {
      recommendations = await recommendSongs(
        player.currentTrack || {
          info: {
            title: topTracks[0]?.key?.split('|||')[0] || 'popular',
            author: 'Unknown',
          },
        },
        player.queue,
        5
      );
    } catch (err) {
      console.error('[Autoplay] AI recommendation error:', err.message);
    }
  }

  // 2. Fallback to a random top track
  if (recommendations.length === 0 && topTracks.length > 0) {
    const randomTop = topTracks[Math.floor(Math.random() * topTracks.length)];
    const [title] = randomTop.key.split('|||');
    recommendations = [{ title, artist: '', reason: 'Popular in this server' }];
  }

  // 3. Fallback to generic search
  if (recommendations.length === 0) {
    const node = player.node;
    const fallbackQueries = [
      'scsearch:trending',
      'scsearch:top hits 2026',
      'scsearch:popular music',
    ];
    for (const query of fallbackQueries) {
      try {
        const response = await loadTrack(node, query);
        if (response?.loadType === 'search' && response.data?.length > 0) {
          return response.data[Math.floor(Math.random() * response.data.length)];
        }
      } catch (err) {
        console.error('[Autoplay fallback] Error:', err.message);
      }
    }
    return null;
  }

  // Resolve recommendation to a real track via search
  const node = player.node;
  const rec = recommendations[Math.floor(Math.random() * recommendations.length)];
  try {
    const response = await loadTrack(
      node,
      `scsearch:${rec.title} ${rec.artist || ''}`
    );
    if (response?.loadType === 'search' && response.data?.length > 0) {
      return response.data[0];
    }
  } catch (err) {
    console.error('[Autoplay] Failed to load:', rec.title, err.message);
  }

  return null;
}

/**
 * Load an autoplay track, add it to the queue, and start playback.
 * Returns true if successful, false otherwise.
 */
async function playAutoplayTrack(client, player) {
  const trackData = await loadAutoplayTrack(client, player);
  if (!trackData) return false;

  player.queue.add({
    track: trackData.encoded,
    info: trackData.info,
    requester: client.user,
  });
  await player.play();
  return true;
}

module.exports = {
  loadAutoplayTrack,
  playAutoplayTrack,
};
