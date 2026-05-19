const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'pause',
  description: 'Pause the current track',
  inVc: true,
  sameVc: true,
  player: true,
  current: true,
  run: async (client, interaction) => {
    const player = client.poru.players.get(interaction.guild.id);
    if (player.isPaused) return interaction.reply({ content: 'Already paused.', ephemeral: true });

    player.pause(true);
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor('Yellow').setDescription('⏸️ Paused.')],
      ephemeral: true,
    });
  },
};
