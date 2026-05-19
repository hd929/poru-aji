const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'resume',
  description: 'Resume the paused track',
  inVc: true,
  sameVc: true,
  player: true,
  run: async (client, interaction) => {
    const player = client.poru.players.get(interaction.guild.id);
    if (!player.isPaused) return interaction.reply({ content: 'Not paused.', ephemeral: true });

    player.pause(false);
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor('Green').setDescription('▶️ Resumed.')],
      ephemeral: true,
    });
  },
};
