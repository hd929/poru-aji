const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'disconnect',
  description: 'Disconnect the bot from your voice channel',
  inVc: true,
  sameVc: true,
  player: true,
  run: async (client, interaction) => {
    const player = client.poru.players.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'No player exists.', ephemeral: true });

    player.autoplay = false;
    player.radioMode = false;
    player.destroy();

    return interaction.reply({
      embeds: [new EmbedBuilder().setColor('White').setDescription('Disconnected.')],
      ephemeral: true,
    });
  },
};
