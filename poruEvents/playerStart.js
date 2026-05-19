const { incrementTrack } = require('../utils/db');

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

module.exports.event = 'trackStart';
module.exports.run = async (client, player, track) => {
  console.log(`[trackStart] ${track.info.title.substring(0, 40)} | queue: ${player.queue.length} | radio: ${player.radioMode}`);

  try {
    await incrementTrack(player.guildId, track.info.title, track.info.uri);
  } catch (err) {
    console.error('[TopTracks] Failed:', err.message);
  }

  if (player._firstTrack || (!player.radioMode && player.queue.length === 0)) {
    player._firstTrack = false;
    return;
  }

  if (player.radioMode) {
    if (player.queue.length < 2) {
      preloadRadioTrack(client, player);
    }
    return;
  }
};

async function preloadRadioTrack(client, player) {
  if (player._radioLoading) return;
  if (!player.radioMode) return;
  player._radioLoading = true;

  const node = player.node;
  let loaded = 0;

  for (let i = 0; i < 2; i++) {
    if (!player.radioMode) break;
    const genre = RADIO_GENRES[player._radioGenreIndex % RADIO_GENRES.length];
    player._radioGenreIndex++;

    try {
      const res = await node.rest.get(`/v4/loadtracks?identifier=${encodeURIComponent(genre)}`);
      if (res?.loadType === 'search' && res.data?.length > 0 && player.radioMode) {
        const randomIdx = Math.floor(Math.random() * Math.min(res.data.length, 5));
        const t = res.data[randomIdx];
        player.queue.add({ track: t.encoded, info: t.info, requester: client.user });
        loaded++;
      }
    } catch (err) {
      console.error('[Radio preload] Error:', err.message);
    }
  }

  console.log(`[Radio] Preloaded ${loaded} tracks. Queue now: ${player.queue.length}`);
  player._radioLoading = false;
}
