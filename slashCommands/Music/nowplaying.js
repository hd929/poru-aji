const { EmbedBuilder } = require('discord.js');
const { createNowPlayingEmbed, createMusicButtons } = require('../../utils/musicUtils');

module.exports = {
  name: 'nowplaying',
  description: 'Show information about the currently playing song',
  inVc: true,
  sameVc: true,
  player: true,
  run: async (client, interaction) => {
    const player = client.poru.players.get(interaction.guildId);

    if (!player || !player.currentTrack) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ No music is currently playing!')],
        ephemeral: true,
      });
    }

    const track = player.currentTrack;
    const embed = createNowPlayingEmbed(track, player);
    const buttons = createMusicButtons(player.isPaused, player.loop || 'NONE');

    return interaction.reply({ embeds: [embed], components: buttons, ephemeral: true });
  },
};
