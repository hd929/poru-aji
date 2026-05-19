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

module.exports.event = 'trackError';
module.exports.run = async (client, player, track, error) => {
  const title = track?.info?.title || 'Unknown track';
  console.log(`[trackError] ${title.substring(0, 40)}: ${error.exception?.message || 'Unknown'}`);

  if (player.radioMode) {
    player._radioErrors = (player._radioErrors || 0) + 1;
    if (player._radioErrors > 10) {
      player.radioMode = false;
      player.destroy();
      return;
    }

    if (player.queue.length < 2) {
      const node = player.node;
      let loaded = 0;

      for (let i = 0; i < 3; i++) {
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
          console.error('[Radio error recovery] Error:', err.message);
        }
      }
      console.log(`[Radio error recovery] Loaded ${loaded} tracks. Queue: ${player.queue.length}`);
    }

    if (!player.radioMode) return;

    if (player.queue.length > 0) {
      await player.play();
    } else {
      player.radioMode = false;
      player.destroy();
    }
    return;
  }

  if (player.queue.length > 0) {
    player.play();
  } else if (player.autoplay) {
    const queueEnd = require('./queueEnd');
    await queueEnd.run(client, player);
  } else {
    player.destroy();
  }
};
