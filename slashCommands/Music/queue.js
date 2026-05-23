const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { formatDuration } = require('../../utils/musicUtils');

function buildPage(player, pageNum) {
  const perPage = 10;
  const tracks = player.queue;
  const totalPages = Math.max(1, Math.ceil(tracks.length / perPage));
  const page = Math.min(Math.max(1, pageNum), totalPages);
  const start = (page - 1) * perPage;
  const end = Math.min(start + perPage, tracks.length);

  let description = '';

  if (player.currentTrack) {
    const cur = player.currentTrack;
    const req = cur.info.requester ? ` — <@${cur.info.requester.id}>` : '';
    description += `▶️ **Now Playing:** [${cur.info.title.substring(0, 50)}](${cur.info.uri}) \`${formatDuration(cur.info.length)}\`${req}\n\n`;
  }

  if (player.radioMode) {
    description += '📻 **Radio Mode** — AI auto-loads tracks\n\n';
  } else if (player.autoplay) {
    description += '🔄 **Autoplay On** — AI continues after queue\n\n';
  }

  if (tracks.length === 0) {
    description += 'Queue is empty.';
  } else {
    for (let i = start; i < end; i++) {
      const t = tracks[i];
      const req = t.info.requester ? ` — <@${t.info.requester.id}>` : '';
      description += `${i + 1}. [${t.info.title.substring(0, 50)}](${t.info.uri}) \`${formatDuration(t.info.length)}\`${req}\n`;
    }
    if (tracks.length > perPage) {
      description += `\n*Page ${page}/${totalPages} (${tracks.length} tracks)*`;
    }
  }

  const totalMs = tracks.reduce((sum, t) => sum + (t.info.length || 0), 0);
  const footer = `Page ${page}/${totalPages} | ${tracks.length} tracks | ${formatDuration(totalMs)} total`;

  const row = new ActionRowBuilder();
  if (totalPages > 1) {
    if (page > 1) row.addComponents(new ButtonBuilder().setCustomId('queue_prev').setLabel('◀️ Prev').setStyle(ButtonStyle.Secondary));
    row.addComponents(new ButtonBuilder().setCustomId('queue_next').setLabel('Next ▶️').setStyle(ButtonStyle.Secondary).setDisabled(page >= totalPages));
  }

  const embed = new EmbedBuilder()
    .setColor('Blue')
    .setTitle('Queue')
    .setDescription(description)
    .setFooter({ text: footer });

  return { embed, components: row.components.length > 0 ? [row] : [] };
}

module.exports = {
  name: 'queue',
  description: 'View the current queue',
  inVc: true,
  player: true,
  run: async (client, interaction) => {
    const player = client.poru.players.get(interaction.guild.id);
    if (!player?.currentTrack && player.queue.length === 0) {
      return interaction.reply({ content: 'Queue is empty.', ephemeral: true });
    }

    const { embed, components } = buildPage(player, 1);
    const msg = await interaction.reply({ embeds: [embed], components, fetchReply: true, ephemeral: true });

    if (components.length === 0) return;

    const collector = msg.createMessageComponentCollector({ time: 2 * 60 * 1000 });
    let currentPage = 1;

    collector.on('collect', async (i) => {
      await i.deferUpdate();
      if (i.customId === 'queue_prev') currentPage = Math.max(1, currentPage - 1);
      else if (i.customId === 'queue_next') currentPage++;

      const { embed: newEmbed, components: newComponents } = buildPage(player, currentPage);
      await i.editReply({ embeds: [newEmbed], components: newComponents });
    });

    collector.on('end', () => {
      const { embed: finalEmbed } = buildPage(player, currentPage);
      msg.edit({ embeds: [finalEmbed], components: [] }).catch(() => {});
    });
  },
};
