const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'leave',
  description: 'Leave the voice channel',
  inVc: true,
  sameVc: true,
  player: true,
  run: async (client, interaction) => {
    const player = client.poru.players.get(interaction.guildId);
    player.autoplay = false;
    player.radioMode = false;
    player.destroy();

    return interaction.reply({ embeds: [new EmbedBuilder().setColor('White').setDescription('Left the voice channel.')], ephemeral: true });
  },
};
