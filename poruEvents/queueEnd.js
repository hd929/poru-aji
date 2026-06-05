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

    // Try up to 4 times with increasing delays before giving up
    let loaded = 0;
    const delays = [0, 3000, 5000, 8000];
    for (const delay of delays) {
      if (delay > 0) await new Promise(r => setTimeout(r, delay));
      if (!player.radioMode || player._destroying) return;
      loaded = await loadRadioTracks(client, player, 3);
      if (loaded > 0) break;
      console.log(`[Radio queueEnd] Load attempt failed, retrying...`);
    }

    if (loaded > 0) {
      player._radioErrors = 0;
      await player.play();
    } else {
      console.log('[Radio queueEnd] All retries exhausted, destroying.');
      player.radioMode = false;
      await player.destroy();
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
