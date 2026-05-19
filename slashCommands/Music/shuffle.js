const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'shuffle',
  description: 'Shuffle the music queue',
  inVc: true,
  sameVc: true,
  player: true,
  run: async (client, interaction) => {
    const player = client.poru.players.get(interaction.guildId);

    if (!player) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ No music player found!')],
        ephemeral: true,
      });
    }

    if (player.queue.length === 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ No songs in queue to shuffle!')],
        ephemeral: true,
      });
    }

    if (player.queue.length < 2) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Need at least 2 tracks to shuffle!')],
        ephemeral: true,
      });
    }

    for (let i = player.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [player.queue[i], player.queue[j]] = [player.queue[j], player.queue[i]];
    }

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('🔀 Queue Shuffled')
      .setDescription(`Shuffled **${player.queue.length}** song(s) in the queue`)
      .addFields({ name: '👤 Shuffled by', value: interaction.user.toString(), inline: true })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
