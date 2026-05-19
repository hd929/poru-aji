const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'stop',
  description: 'Stop playing and leave voice channel',
  inVc: true,
  sameVc: true,
  player: true,
  run: async (client, interaction) => {
    const player = client.poru.players.get(interaction.guild.id);
    player.autoplay = false;
    player.radioMode = false;
    player.destroy();
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor('Red').setDescription('⏹️ Stopped.')],
      ephemeral: true,
    });
  },
};
