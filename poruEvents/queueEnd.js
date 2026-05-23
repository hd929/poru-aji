const { loadRadioTracks } = require('../utils/radio');
const { playAutoplayTrack } = require('../utils/autoplay');

module.exports.event = 'queueEnd';
module.exports.run = async (client, player) => {
  if (player._destroying) return;

  if (player._emptyTimeout) {
    clearTimeout(player._emptyTimeout);
    player._emptyTimeout = null;
  }

  if (player.radioMode) {
    console.log(`[Radio queueEnd] Queue empty, loading tracks...`);
    const loaded = await loadRadioTracks(client, player, 3);
    if (loaded > 0) {
      player._radioErrors = 0;
      await player.play();
    } else {
      console.log('[Radio queueEnd] Could not load tracks, retrying once...');
      await new Promise(r => setTimeout(r, 3000));
      const retryLoaded = await loadRadioTracks(client, player, 3);
      if (retryLoaded > 0) {
        player._radioErrors = 0;
        await player.play();
      } else {
        console.log('[Radio queueEnd] Still no tracks after retry, destroying.');
        player.radioMode = false;
        await player.destroy();
      }
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

  const success = await playAutoplayTrack(client, player);
  if (!success) {
    player._emptyTimeout = setTimeout(() => {
      player._emptyTimeout = null;
      player._destroying = true;
      player.destroy();
    }, 5 * 60 * 1000);
  }
};
