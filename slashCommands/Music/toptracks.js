const { EmbedBuilder } = require('discord.js');
const { getTopTracksForGuild } = require('../../utils/db');

module.exports = {
  name: 'toptracks',
  description: 'Show most played tracks in this server',
  inVc: true,
  run: async (client, interaction) => {
    const topTracks = await getTopTracksForGuild(interaction.guildId, 10);

    if (topTracks.length === 0) {
      return interaction.reply({
        content: 'No tracks have been played in this server yet.',
        ephemeral: true,
      });
    }

    const description = topTracks
      .map((doc, i) => {
        const [title, uri] = doc.key.split('|||');
        const emoji = ['🥇', '🥈', '🥉'][i] || `${i + 1}.`;
        return `${emoji} [${title.substring(0, 50)}](${uri}) — **${doc.count}** plays`;
      })
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor('Gold')
      .setTitle('Top Tracks')
      .setDescription(description)
      .setFooter({ text: `Server: ${interaction.guild.name}` });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
