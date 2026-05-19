const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');

module.exports = {
  name: 'clear',
  description: 'Clear bot messages in this channel',
  options: [
    {
      name: 'amount',
      type: ApplicationCommandOptionType.Integer,
      description: 'Number of bot messages to delete (1-100)',
      required: false,
      min_value: 1,
      max_value: 100,
    },
  ],
  run: async (client, interaction) => {
    if (!interaction.member.permissions.has('ManageMessages')) {
      return interaction.reply({ content: 'You need Manage Messages permission.', ephemeral: true });
    }

    const amount = interaction.options.getInteger('amount') || 10;
    const safeAmount = Math.min(Math.max(amount, 1), 100);

    await interaction.deferReply({ ephemeral: true });

    try {
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      const botMessages = messages.filter(m => m.author.id === client.user.id && m.deletable);

      const toDelete = botMessages.first(safeAmount);

      if (toDelete.length === 0) {
        return interaction.editReply({ content: 'No bot messages to delete.', ephemeral: true });
      }

      let deleted = 0;
      for (const msg of toDelete) {
        await msg.delete().catch(() => {});
        deleted++;
      }

      const embed = new EmbedBuilder()
        .setColor('Green')
        .setDescription(`🗑️ Deleted **${deleted}** bot messages.`);

      await interaction.editReply({ embeds: [embed], ephemeral: true });
      setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
    } catch (err) {
      return interaction.editReply({ content: `Failed to delete messages: ${err.message}`, ephemeral: true });
    }
  },
};
