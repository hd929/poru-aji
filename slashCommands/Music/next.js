const { EmbedBuilder } = require('discord.js');
const { loadRadioTracks } = require('../../utils/radio');

module.exports = {
  name: 'next',
  description: 'Skip to the next track',
  inVc: true,
  sameVc: true,
  player: true,
  run: async (client, interaction) => {
    const player = client.poru.players.get(interaction.guildId);
    if (!player?.currentTrack) return interaction.reply({ content: 'Nothing to skip.', ephemeral: true });

    const currentTitle = (player.currentTrack.info?.title || 'Unknown').substring(0, 50);

    await interaction.deferReply({ ephemeral: true }).catch(() => {});

    if (player.radioMode && player.queue.length < 3 && !player._radioLoading) {
      await loadRadioTracks(client, player, 2);
    }

    if (player.queue.length === 0) {
      return interaction.editReply({ content: 'No tracks in queue to skip to. Use `/play` to add tracks.' });
    }

    await player.skip();

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor('Green')
          .setDescription(`⏭️ Skipped **${currentTitle}**`),
      ],
    });
  },
};
