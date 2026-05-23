const { searchRadioTrack, loadRadioTracks } = require('../utils/radio');

module.exports.event = 'trackError';
module.exports.run = async (client, player, track, error) => {
  const title = track?.info?.title || 'Unknown track';
  const author = track?.info?.author || '';
  const errMsg = error.exception?.message || 'Unknown';
  console.log(`[trackError] ${title.substring(0, 40)}: ${errMsg}`);

  if (player.radioMode) {
    player._radioErrors = (player._radioErrors || 0) + 1;
    if (player._radioErrors > 15) {
      console.log('[Radio] Too many consecutive errors, destroying.');
      player.radioMode = false;
      await player.destroy();
      return;
    }

    // Try to refill the queue if low
    if (player.queue.length < 2 && !player._radioLoading) {
      const loaded = await loadRadioTracks(client, player, 3);
      console.log(`[Radio error recovery] Loaded ${loaded} tracks. Queue: ${player.queue.length}`);
    }

    if (!player.radioMode) return;

    if (player.queue.length > 0) {
      player._radioErrors = 0;
      await player.play();
    } else {
      // Queue still empty — one more attempt with a delay
      console.log('[trackError] Queue empty after error, trying to reload...');
      const retryLoaded = await loadRadioTracks(client, player, 3);
      if (retryLoaded > 0) {
        player._radioErrors = 0;
        await player.play();
      } else {
        console.log('[trackError] Could not reload tracks, waiting before retry...');
        setTimeout(async () => {
          if (!player.radioMode || player._destroying) return;
          const qe = require('./queueEnd');
          await qe.run(client, player);
        }, 5000);
      }
    }
    return;
  }

  // Non-radio error handling
  if (player.queue.length > 0) {
    await player.play();
  } else if (player.autoplay) {
    const queueEnd = require('./queueEnd');
    await queueEnd.run(client, player);
  } else if (track?.info?.sourceName === 'youtube') {
    console.log('[trackError] YouTube track failed, trying SoundCloud fallback...');
    try {
      const searchQuery = `${title} ${author}`.substring(0, 100);
      const result = await searchRadioTrack(player.node, searchQuery);
      if (result) {
        console.log(`[trackError] Fallback found on ${result.source || 'soundcloud'}`);
        player.queue.add({ track: result.encoded, info: result.info, requester: track.info.requester || client.user });
        await player.play();
        return;
      }
    } catch (err) {
      console.error('[trackError] Fallback search failed:', err.message);
    }
    console.log('[trackError] No fallback found. Keeping player alive.');
  } else {
    console.log('[trackError] Track failed, queue empty, autoplay off. Keeping player alive.');
  }
};
