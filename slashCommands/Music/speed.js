const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');

const speedLevels = {
  '0.25x': 0.25,
  '0.5x': 0.5,
  '0.75x': 0.75,
  '1.0x': 1.0,
  '1.25x': 1.25,
  '1.5x': 1.5,
  '1.75x': 1.75,
  '2.0x': 2.0,
};

module.exports = {
  name: 'speed',
  description: 'Change playback speed of the current track',
  inVc: true,
  sameVc: true,
  player: true,
  options: [
    {
      name: 'rate',
      type: ApplicationCommandOptionType.String,
      description: 'Playback speed (e.g. 0.5x, 1.0x, 1.5x, 2.0x)',
      required: true,
    },
  ],
  run: async (client, interaction) => {
    const player = client.poru.players.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: '❌ No player found.', ephemeral: true });

    const rateStr = interaction.options.getString('rate', true).toLowerCase().replace('x', '');
    let rate = parseFloat(rateStr);

    if (isNaN(rate) || rate < 0.25 || rate > 2.0) {
      return interaction.reply({ content: '❌ Invalid speed. Use values between 0.25x and 2.0x', ephemeral: true });
    }

    rate = Math.round(rate * 100) / 100; // Round to 2 decimal places

    try {
      await player.setFilter({
        timescale: { speed: rate },
      });

      if (!player.filters) player.filters = {};
      player.filters.speed = rate;

      const embed = new EmbedBuilder()
        .setColor('#E74C3C')
        .setTitle('⚡ Speed Changed')
        .setDescription(`Playback speed set to **${rate}x**`);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err) {
      return interaction.reply({ content: `❌ Failed to change speed: ${err.message}`, ephemeral: true });
    }
  },
};