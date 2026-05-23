const { EmbedBuilder } = require('discord.js');
const { loadRadioTracks } = require('../../utils/radio');

module.exports = {
  name: 'radio',
  description: 'Start radio mode - continuous music playback',
  inVc: true,
  sameVc: true,
  run: async (client, interaction) => {
    const existing = client.poru.players.get(interaction.guildId);
    if (existing) {
      existing.radioMode = true;
      existing.autoplay = true;
      existing._radioErrors = 0;
      if (existing._radioGenreIndex === undefined) existing._radioGenreIndex = 0;

      if (existing.queue.length < 5 && !existing._radioLoading) {
        const loaded = await loadRadioTracks(client, existing, 5);
        if (loaded > 0 && !existing.isPlaying && !existing.isPaused) {
          await existing.play();
        }
      }

      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('Purple').setDescription('📻 Radio mode enabled!')],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const player = client.poru.createConnection({
      guildId: interaction.guildId,
      voiceChannel: interaction.member.voice.channelId,
      textChannel: interaction.channel.id,
      deaf: true,
    });

    player.radioMode = true;
    player.autoplay = true;
    player._radioGenreIndex = 0;
    player._radioErrors = 0;

    const node = client.poru.leastUsedNodes[0];
    if (!node) return interaction.editReply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ No Lavalink node available.')], ephemeral: true });

    const loaded = await loadRadioTracks(client, player, 5);

    if (loaded === 0) {
      player.destroy();
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Could not load any tracks.')], ephemeral: true });
    }

    await player.play();

    interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor('Purple')
          .setAuthor({ name: 'AI Radio', iconURL: client.user.displayAvatarURL() })
          .setDescription(`📻 Radio started! Loaded **${loaded}** tracks. Music plays continuously.\nUse \`/stop\` to end.`),
      ],
      ephemeral: true,
    });
  },
};
