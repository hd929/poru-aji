const { EmbedBuilder } = require('discord.js');
const { explainSong } = require('../../utils/ai');

module.exports = {
  name: 'why',
  description: 'AI explains why this song fits the vibe',
  inVc: true,
  sameVc: true,
  player: true,
  current: true,
  run: async (client, interaction) => {
    const player = client.poru.players.get(interaction.guild.id);
    if (!player?.currentTrack) return interaction.reply({ content: 'Nothing is playing.', ephemeral: true });

    await interaction.deferReply();

    let explanation;
    try {
      explanation = await explainSong(player.currentTrack, player.queue);
    } catch (err) {
      console.error('[AI] Connection error:', err.message);
      return interaction.editReply({ content: 'AI is currently unavailable.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('Purple')
      .setAuthor({ name: 'AI DJ', iconURL: client.user.displayAvatarURL() })
      .setTitle(player.currentTrack.info.title.substring(0, 100))
      .setDescription(explanation)
      .setFooter({ text: `by ${player.currentTrack.info.author}` });

    return interaction.editReply({ embeds: [embed], ephemeral: true });
  },
};
