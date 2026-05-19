const { EmbedBuilder } = require('discord.js');
const { summarizeQueue } = require('../../utils/ai');

module.exports = {
  name: 'summarizequeue',
  description: 'AI describes the vibe of the current queue',
  inVc: true,
  player: true,
  run: async (client, interaction) => {
    const player = client.poru.players.get(interaction.guild.id);
    if (!player || player.queue.length === 0) {
      return interaction.reply({ content: 'Queue is empty.', ephemeral: true });
    }

    await interaction.deferReply();

    let summary;
    try {
      summary = await summarizeQueue(player.queue);
    } catch (err) {
      console.error('[AI] Connection error:', err.message);
      return interaction.editReply({ content: 'AI is currently unavailable.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('Purple')
      .setAuthor({ name: 'Queue Vibe', iconURL: client.user.displayAvatarURL() })
      .setDescription(summary)
      .setFooter({ text: `${player.queue.length} tracks in queue` });

    return interaction.editReply({ embeds: [embed], ephemeral: true });
  },
};
