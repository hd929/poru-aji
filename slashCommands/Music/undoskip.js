const { EmbedBuilder } = require('discord.js');

// Queue history per guild (in-memory)
const queueHistory = new Map();
const MAX_HISTORY = 20;

module.exports = {
  name: 'undoskip',
  description: 'Play the last skipped or previous track again',
  inVc: true,
  sameVc: true,
  player: true,
  run: async (client, interaction) => {
    const player = client.poru.players.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: '❌ No player found.', ephemeral: true });

    const history = queueHistory.get(interaction.guild.id) || [];
    if (history.length === 0) {
      return interaction.reply({ content: '❌ No track history available.', ephemeral: true });
    }

    const track = history.shift(); // Get most recent skipped track
    if (!track) {
      return interaction.reply({ content: '❌ No track to undo.', ephemeral: true });
    }

    player.queue.unshift(track);
    await player.skip();

    return interaction.reply({ content: `⏮️ Replay: **${track.info.title.substring(0, 80)}**`, ephemeral: true });
  },
};

// Export helper to track skipped tracks
module.exports.trackSkip = (guildId, track) => {
  if (!queueHistory.has(guildId)) queueHistory.set(guildId, []);
  const history = queueHistory.get(guildId);
  history.unshift(track);
  if (history.length > MAX_HISTORY) history.pop();
};

module.exports.getHistory = (guildId) => queueHistory.get(guildId) || [];