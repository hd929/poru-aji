const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const SAVES_DIR = path.join(__dirname, '../../data/savedQueues');

// Ensure directory exists
if (!fs.existsSync(SAVES_DIR)) {
  fs.mkdirSync(SAVES_DIR, { recursive: true });
}

function getSavePath(guildId, name) {
  return path.join(SAVES_DIR, `${guildId}-${name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50)}.json`);
}

module.exports.getSavePath = getSavePath;

module.exports = {
  name: 'savequeue',
  description: 'Save the current queue to a named playlist',
  inVc: true,
  sameVc: true,
  player: true,
  options: [
    {
      name: 'name',
      type: 3, // String
      description: 'Name for this saved queue',
      required: true,
    },
  ],
  run: async (client, interaction) => {
    const player = client.poru.players.get(interaction.guildId);
    const name = interaction.options.getString('name', true).trim();

    if (!player || (!player.currentTrack && player.queue.length === 0)) {
      return interaction.reply({ content: '❌ Queue is empty. Nothing to save.', ephemeral: true });
    }

    const tracks = [];

    if (player.currentTrack) {
      const info = player.currentTrack.info || {};
      tracks.push({
        title: info.title || 'Unknown',
        author: info.author || 'Unknown',
        uri: info.uri,
        length: info.length,
      });
    }

    for (const track of player.queue) {
      const info = track.info || track;
      tracks.push({
        title: info.title,
        author: info.author,
        uri: info.uri,
        length: info.length,
      });
    }

    const savePath = getSavePath(interaction.guild.id, name);
    const alreadyExists = fs.existsSync(savePath);

    const saveData = {
      name,
      guildId: interaction.guild.id,
      userId: interaction.user.id,
      createdAt: new Date().toISOString(),
      trackCount: tracks.length,
      tracks,
    };

    fs.writeFileSync(savePath, JSON.stringify(saveData, null, 2));

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle(alreadyExists ? '⚠️ Queue Overwritten' : '✅ Queue Saved')
      .setDescription(`Saved \`${tracks.length}\` tracks as \`${name}\`` + (alreadyExists ? '\n⚠️ A queue with this name already existed and was overwritten.' : ''));

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};