const { EmbedBuilder } = require('discord.js');
const { getServerSetting, setServerSetting } = require('../../utils/db');

module.exports = {
  name: 'volume',
  description: 'Set playback volume (max 150%)',
  inVc: true,
  sameVc: true,
  player: true,
  options: [
    {
      name: 'level',
      type: 4,
      description: 'Volume level (1-150)',
      required: false,
      min_value: 1,
      max_value: 150,
    },
  ],
  run: async (client, interaction) => {
    const player = client.poru.players.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'No player exists.', ephemeral: true });

    const level = interaction.options.getInteger('level');

    if (level === undefined || level === null) {
      const currentVol = await getServerSetting(interaction.guild.id, 'volume', player.volume);
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('Blue').setDescription(`Current volume: **${currentVol}%**`)],
        ephemeral: true,
      });
    }

    const safeLevel = Math.min(Math.max(level, 1), 150);
    player.setVolume(safeLevel);
    await setServerSetting(interaction.guild.id, 'volume', safeLevel);

    return interaction.reply({
      embeds: [new EmbedBuilder().setColor('Green').setDescription(`Volume set to **${safeLevel}%** ${safeLevel > 100 ? '⚠️' : '🔊'}`)],
      ephemeral: true,
    });
  },
};
