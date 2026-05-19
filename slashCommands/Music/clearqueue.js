const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'clearqueue',
  description: 'Clear the entire queue',
  inVc: true,
  sameVc: true,
  player: true,
  run: async (client, interaction) => {
    const player = client.poru.players.get(interaction.guild.id);
    player.queue.clear();
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor('Green').setDescription('🗑️ Queue cleared.')],
      ephemeral: true,
    });
  },
};
