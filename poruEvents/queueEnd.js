const { EmbedBuilder } = require('discord.js');
const { getTopTracksForGuild } = require('../utils/db');
const { recommendSongs } = require('../utils/ai');

const RADIO_GENRES = [
  'scsearch:chill beats instrumental',
  'scsearch:lofi hip hop mix',
  'scsearch:ambient electronic',
  'scsearch:deep house chill',
  'scsearch:indie acoustic cover',
  'scsearch:jazz cafe background',
  'scsearch:synthwave retro',
  'scsearch:study music focus',
  'scsearch:relaxing piano music',
  'scsearch:night drive music',
  'scsearch:tropical house mix',
  'scsearch:future bass chill',
];

async function playAutoplayTrack(client, player) {
  const topTracks = await getTopTracksForGuild(player.guildId, 20);
  let recommendations = [];

  if (topTracks.length >= 3) {
    try {
      const aiRecs = await recommendSongs(
        player.currentTrack || { info: { title: topTracks[0]?.key?.split('|||')[0] || 'popular', author: 'Unknown' } },
        player.queue,
        5
      );
      recommendations = aiRecs;
    } catch (err) {
      console.error('[AI Autoplay] Error:', err.message);
    }
  }

  if (recommendations.length === 0 && topTracks.length > 0) {
    const randomTop = topTracks[Math.floor(Math.random() * topTracks.length)];
    const [title] = randomTop.key.split('|||');
    recommendations = [{ title, artist: '', reason: 'Popular in this server' }];
  }

  if (recommendations.length === 0) {
    const node = player.node;
    const fallbackQueries = ['scsearch:trending', 'scsearch:top hits 2026', 'scsearch:popular music'];
    for (const query of fallbackQueries) {
      try {
        const response = await node.rest.get(`/v4/loadtracks?identifier=${encodeURIComponent(query)}`);
        if (response?.loadType === 'search' && response.data?.length > 0) {
          const randomTrack = response.data[Math.floor(Math.random() * response.data.length)];
          const track = { track: randomTrack.encoded, info: randomTrack.info, requester: client.user };
          player.queue.add(track);
          await player.play();
          return true;
        }
      } catch (err) {
        console.error('[Autoplay fallback] Error:', err.message);
      }
    }
    player.destroy();
    return false;
  }

  const node = player.node;
  const rec = recommendations[Math.floor(Math.random() * recommendations.length)];
  try {
    const response = await node.rest.get(`/v4/loadtracks?identifier=${encodeURIComponent(`scsearch:${rec.title} ${rec.artist || ''}`)}`);
    if (response?.loadType === 'search' && response.data?.length > 0) {
      const track = { track: response.data[0].encoded, info: response.data[0].info, requester: client.user };
      player.queue.add(track);
      await player.play();
      return true;
    }
  } catch (err) {
    console.error('[AI Autoplay] Failed to load:', rec.title, err.message);
  }

  player.destroy();
  return false;
}

module.exports.event = 'playerDisconnect';
module.exports.run = async (client, player) => {
  if (player._destroying) return;

  if (player._emptyTimeout) {
    clearTimeout(player._emptyTimeout);
    player._emptyTimeout = null;
  }

  if (player.radioMode) {
    if (player.queue.length === 0) {
      const node = player.node;
      let loaded = 0;
      for (let i = 0; i < 2; i++) {
        const genre = RADIO_GENRES[player._radioGenreIndex % RADIO_GENRES.length];
        player._radioGenreIndex++;
        try {
          const res = await node.rest.get(`/v4/loadtracks?identifier=${encodeURIComponent(genre)}`);
          if (res?.loadType === 'search' && res.data?.length > 0) {
            const randomIdx = Math.floor(Math.random() * Math.min(res.data.length, 5));
            const t = res.data[randomIdx];
            player.queue.add({ track: t.encoded, info: t.info, requester: client.user });
            loaded++;
          }
        } catch (err) {
          console.error('[Radio queueEnd] Error:', err.message);
        }
      }
      console.log(`[Radio queueEnd] Loaded ${loaded}. Queue: ${player.queue.length}`);
    }
    if (player.queue.length > 0) {
      await player.play();
    }
    return;
  }

  if (!player.autoplay) {
    player._emptyTimeout = setTimeout(() => {
      player._emptyTimeout = null;
      player._destroying = true;
      player.destroy();
    }, 5 * 60 * 1000);
    return;
  }

  await playAutoplayTrack(client, player);
};
