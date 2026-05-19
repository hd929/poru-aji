const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');

module.exports = {
  name: 'remove',
  description: 'Remove a track from the queue',
  inVc: true,
  sameVc: true,
  player: true,
  options: [
    {
      name: 'position',
      type: ApplicationCommandOptionType.Integer,
      description: 'Position in queue (1-based)',
      required: true,
      min_value: 1,
    },
  ],
  run: async (client, interaction) => {
    const player = client.poru.players.get(interaction.guild.id);
    const pos = interaction.options.getInteger('position', true);

    if (pos < 1 || pos > player.queue.length) {
      return interaction.reply({ content: `Invalid position. Queue has ${player.queue.length} tracks.`, ephemeral: true });
    }

    const removed = player.queue.splice(pos - 1, 1)[0];
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor('Green').setDescription(`Removed: **${removed.info.title.substring(0, 50)}**`)],
      ephemeral: true,
    });
  },
};
