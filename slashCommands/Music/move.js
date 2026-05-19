const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');

module.exports = {
  name: 'move',
  description: 'Move a track to a different position in queue',
  inVc: true,
  sameVc: true,
  player: true,
  options: [
    {
      name: 'from',
      type: ApplicationCommandOptionType.Integer,
      description: 'Current position (1-based)',
      required: true,
      min_value: 1,
    },
    {
      name: 'to',
      type: ApplicationCommandOptionType.Integer,
      description: 'Target position (1-based)',
      required: true,
      min_value: 1,
    },
  ],
  run: async (client, interaction) => {
    const player = client.poru.players.get(interaction.guild.id);
    const from = interaction.options.getInteger('from', true);
    const to = interaction.options.getInteger('to', true);

    if (from > player.queue.length || to > player.queue.length) {
      return interaction.reply({ content: 'Invalid position.', ephemeral: true });
    }

    const track = player.queue.splice(from - 1, 1)[0];
    player.queue.splice(to - 1, 0, track);
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor('Green').setDescription(`Moved track from ${from} to ${to}.`)],
      ephemeral: true,
    });
  },
};
