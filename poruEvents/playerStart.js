const { incrementTrack } = require('../utils/db');
const { loadRadioTracks } = require('../utils/radio');

module.exports.event = 'trackStart';
module.exports.run = async (client, player, track) => {
  console.log(`[trackStart] ${track.info.title.substring(0, 40)} | queue: ${player.queue.length} | radio: ${player.radioMode}`);

  try {
    await incrementTrack(player.guildId, track.info.title, track.info.uri);
  } catch (err) {
    console.error('[TopTracks] Failed:', err.message);
  }

  if (player.radioMode) {
    player._radioErrors = 0;
    if (!player._radioHistory) player._radioHistory = [];
    player._radioHistory.push(track.info.title);
    if (player._radioHistory.length > 50) player._radioHistory.shift(); // Keep last 50 tracks

    if (player.queue.length === 0 && !player._radioLoading) {
      const loaded = await loadRadioTracks(client, player, 2);
      if (loaded > 0 && !player.isPlaying) {
        await player.play();
      }
    }
  }
};
