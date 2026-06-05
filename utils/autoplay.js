const { getTopTracksForGuild } = require('./db');
const { recommendSongs } = require('./ai');
const { loadTrack } = require('./loadTrack');

// Smart fallback queries based on time of day
function getTimeBasedQueries() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) {
    return [
      'scsearch:chill morning vibes',
      'scsearch:lofi morning',
      'scsearch:acoustic morning',
    ];
  } else if (hour >= 12 && hour < 18) {
    return [
      'scsearch:daytime focus',
      'scsearch:pop afternoon',
      'scsearch:electronic afternoon',
    ];
  } else if (hour >= 18 && hour < 23) {
    return [
      'scsearch:evening beat',
      'scsearch:lounge evening',
      'scsearch:deep house evening',
    ];
  } else {
    return [
      'scsearch:night drive',
      'scsearch:relax sleep',
      'scsearch:ambient night',
    ];
  }
}

// Genre pools for smart rotation
const GenrePools = {
  morning: ['chill beats instrumental', 'lo-fi study', 'acoustic morning', 'coffee house music'],
  afternoon: ['deep house chill', 'pop hits', 'indie acoustic', 'electronic focus'],
  evening: ['synthwave retro', 'tropical house mix', 'jazz cafe', 'downtempo'],
  night: ['lofi hip hop mix', 'ambient electronic', 'relaxing piano', 'night drive music'],
};

function getTimeBasedGenres() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return GenrePools.morning;
  if (hour >= 12 && hour < 18) return GenrePools.afternoon;
  if (hour >= 18 && hour < 23) return GenrePools.evening;
  return GenrePools.night;
}

/**
 * Load an autoplay track based on server history and AI recommendations.
 * 
 * Returns a track data object ({ encoded, info }) or null.
 */
async function loadAutoplayTrack(client, player) {
  const topTracks = await getTopTracksForGuild(player.guildId, 20);
  let recommendations = [];

  // 1. Try local algorithm recommendations if enough history exists
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
      console.error('[Autoplay] Local recommendation error:', err.message);
    }
  }

  // 2. Fallback to a random top track
  if (recommendations.length === 0 && topTracks.length > 0) {
    const randomTop = topTracks[Math.floor(Math.random() * topTracks.length)];
    const [title] = randomTop.key.split('|||');
    recommendations = [{ title, artist: '', reason: 'Popular in this server' }];
  }

  // 3. Fallback to time-based generic search
  if (recommendations.length === 0) {
    const node = player.node;
    const fallbackQueries = getTimeBasedQueries();
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

  // 4. Resolve recommendation to a real track via search
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

  // 5. Smart genre-based final fallback
  try {
    const genres = getTimeBasedGenres();
    const randomGenre = genres[Math.floor(Math.random() * genres.length)];
    const genreResponse = await loadTrack(node, `scsearch:${randomGenre}`);
    if (genreResponse?.loadType === 'search' && genreResponse.data?.length > 0) {
      return genreResponse.data[Math.floor(Math.random() * genreResponse.data.length)];
    }
  } catch {}

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

// Per-server genre preference management
function getServerGenrePref(guildId, defaultGenres) {
  try {
    const fs = require('fs');
    const path = require('path');
    const settingsPath = path.join(__dirname, '../data/settings.json');
    if (!fs.existsSync(settingsPath)) return defaultGenres;
    const prefs = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    return (prefs[guildId] && prefs[guildId].genres) ? prefs[guildId].genres : defaultGenres;
  } catch {
    return defaultGenres;
  }
}

// Track autoplay stats for smarter future selections
const autoplayStats = new Map();

function recordAutoplayResult(guildId, trackInfo, success) {
  if (!autoplayStats.has(guildId)) {
    autoplayStats.set(guildId, []);
  }
  const stats = autoplayStats.get(guildId);
  stats.push({ title: trackInfo.title, author: trackInfo.author, success, time: Date.now() });
  // Keep only last 50 stats
  if (stats.length > 50) stats.shift();
}

module.exports = {
  loadAutoplayTrack,
  playAutoplayTrack,
  getTimeBasedGenres,
  getTimeBasedQueries,
  recordAutoplayResult,
};