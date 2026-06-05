const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const buttonCooldowns = new Map();
const COOLDOWN_MS = 3000;
const COOLDOWN_CLEANUP_INTERVAL = 60_000; // Clean stale entries every 60s

// Prevent memory leak: periodically purge expired cooldown entries
setInterval(() => {
  const now = Date.now();
  for (const [userId, timestamp] of buttonCooldowns) {
    if (now - timestamp > COOLDOWN_MS) {
      buttonCooldowns.delete(userId);
    }
  }
}, COOLDOWN_CLEANUP_INTERVAL).unref();

function isOnCooldown(userId) {
  const now = Date.now();
  const last = buttonCooldowns.get(userId) || 0;
  if (now - last < COOLDOWN_MS) return true;
  buttonCooldowns.set(userId, now);
  return false;
}

function formatDuration(duration) {
  if (!duration || duration === 0) return '00:00';
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor(duration / (1000 * 60 * 60));
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function createProgressBar(current, total, length = 20) {
  if (!total || total === 0) return '▬'.repeat(length);
  const progress = Math.min(Math.round((current / total) * length), length);
  const emptyProgress = length - progress;
  return '▬'.repeat(Math.max(0, progress)) + '🔘' + '▬'.repeat(Math.max(0, emptyProgress));
}

function getTimecode(position, duration) {
  if (!duration || duration === 0) return 'LIVE';
  const posTime = formatDuration(position);
  const durationTime = formatDuration(duration);
  return `${posTime} / ${durationTime}`;
}

function createNowPlayingEmbed(track, player) {
  const info = track.info || track;
  const requester = track.requester || info.requester;
  const duration = info.length || 0;
  const isLive = duration === 0;

  const embed = new EmbedBuilder()
    .setColor(player.isPaused ? '#FFA500' : '#00FF00')
    .setAuthor({
      name: '🎵 Now Playing',
      iconURL: 'https://cdn.discordapp.com/attachments/984739502901362708/1105151528659615824/vinyl.png'
    })
    .setTitle(info.title.substring(0, 100))
    .setURL(info.uri || '')
    .setDescription(info.author || 'Unknown Artist')
    .addFields(
      { name: '⏱ Duration', value: isLive ? '🔴 LIVE' : formatDuration(duration), inline: true },
      { name: '🔊 Volume', value: `${player.volume}%`, inline: true },
      { name: '🔁 Loop', value: player.loop === 'NONE' ? 'Off' : player.loop === 'TRACK' ? 'Track' : 'Queue', inline: true },
      { name: '📋 Queue', value: `${player.queue.length} song(s)`, inline: true },
      { name: '⏸ Status', value: player.isPaused ? 'Paused' : 'Playing', inline: true },
      { name: '📻 Radio', value: player.radioMode ? 'On' : 'Off', inline: true }
    )
    .setFooter({ text: 'Use the buttons below to control playback' })
    .setTimestamp();

  if (requester?.id) {
    embed.addFields({ name: '🎧 Requested by', value: `<@${requester.id}>`, inline: true });
  }

  const imageUrl = info.artworkUrl || info.thumbnail || null;
  if (imageUrl) embed.setThumbnail(imageUrl);

  if (player.position && duration && !isLive) {
    const progressBar = createProgressBar(player.position, duration);
    const timecode = getTimecode(player.position, duration);
    embed.addFields({
      name: `⏯ Progress ${timecode}`,
      value: '```' + progressBar + '```',
      inline: false
    });
  }

  return embed;
}

function createMusicButtons(isPaused, loopMode) {
  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('music_prev')
        .setEmoji('⏮️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_pause')
        .setEmoji(isPaused ? '▶️' : '⏸️')
        .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_skip')
        .setEmoji('⏭️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_stop')
        .setEmoji('⏹️')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('music_refresh')
        .setEmoji('🔄')
        .setStyle(ButtonStyle.Secondary)
    );

  const loopStyle = loopMode === 'NONE' ? ButtonStyle.Secondary : ButtonStyle.Primary;
  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('music_vol_down')
        .setEmoji('🔉')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_vol_up')
        .setEmoji('🔊')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_shuffle')
        .setEmoji('🔀')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_loop')
        .setEmoji(loopMode === 'QUEUE' ? '🔁' : loopMode === 'TRACK' ? '🔂' : '🔁')
        .setStyle(loopStyle),
      new ButtonBuilder()
        .setCustomId('music_queue')
        .setEmoji('📋')
        .setStyle(ButtonStyle.Secondary)
    );

  return [row1, row2];
}

function createDisabledButtons() {
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('music_disabled')
        .setEmoji('⏹️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('music_disabled2')
        .setEmoji('🚫')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('music_disabled3')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('music_disabled4')
        .setEmoji('🔇')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('music_disabled5')
        .setEmoji('🔁')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );
  return [row];
}

function createQueueEmbed(player, page = 0) {
  const queue = player.queue;
  const tracksPerPage = 10;
  const start = page * tracksPerPage;
  const end = start + tracksPerPage;
  const tracks = queue.slice(start, end);

  const embed = new EmbedBuilder()
    .setColor('#3498DB')
    .setTitle('📋 Music Queue')
    .setTimestamp();

  if (player.currentTrack) {
    const info = player.currentTrack.info || player.currentTrack;
    const requester = player.currentTrack.requester || info.requester;
    const requesterText = requester?.id ? ` | <@${requester.id}>` : '';
    embed.addFields({
      name: '▶️ Now Playing',
      value: `**${(info.title || 'Unknown').substring(0, 80)}** - ${formatDuration(info.length)}${requesterText}`,
      inline: false
    });
  }

  if (queue.length === 0) {
    embed.setDescription('The queue is empty! Add some songs with `/play`');
    return embed;
  }

  let description = '';
  tracks.forEach((track, index) => {
    const position = start + index + 1;
    const info = track.info || track;
    const requester = track.requester || info.requester;
    description += `**${position}.** [${(info.title || 'Unknown').substring(0, 50)}](${info.uri || ''}) - \`${formatDuration(info.length)}\``;
    if (requester?.id) description += ` <@${requester.id}>`;
    description += '\n';
  });

  embed.setDescription(description);

  const totalPages = Math.ceil(queue.length / tracksPerPage);
  const totalDuration = queue.reduce((sum, t) => sum + (t.info?.length || t.length || 0), 0);
  embed.setFooter({
    text: `Page ${page + 1}/${totalPages} • ${queue.length} song(s) • ${formatDuration(totalDuration)} total`
  });

  return embed;
}

function createQueueButtons(page, totalPages) {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('queue_prev')
        .setLabel('Previous')
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId('queue_next')
        .setLabel('Next')
        .setEmoji('➡️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= totalPages - 1),
      new ButtonBuilder()
        .setCustomId('queue_close')
        .setLabel('Close')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Danger)
    );
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function truncateText(text, length = 50) {
  if (text.length <= length) return text;
  return text.substring(0, length - 3) + '...';
}

module.exports = {
  isOnCooldown,
  formatDuration,
  createProgressBar,
  getTimecode,
  createNowPlayingEmbed,
  createMusicButtons,
  createDisabledButtons,
  createQueueEmbed,
  createQueueButtons,
  isValidUrl,
  truncateText
};