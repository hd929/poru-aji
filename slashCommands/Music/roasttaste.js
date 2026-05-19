const { EmbedBuilder } = require('discord.js');
const { roastTaste } = require('../../utils/ai');

module.exports = {
  name: 'roasttaste',
  description: 'AI roasts your music taste (fun)',
  inVc: true,
  run: async (client, interaction) => {
    const player = client.poru.players.get(interaction.guild.id);

    await interaction.deferReply();

    const queue = player?.queue || [];
    let roast;
    try {
      roast = await roastTaste(queue);
    } catch (err) {
      console.error('[AI] Connection error:', err.message);
      return interaction.editReply({ content: 'AI is currently unavailable.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('DarkRed')
      .setAuthor({ name: 'AI Roast', iconURL: client.user.displayAvatarURL() })
      .setDescription(roast)
      .setFooter({ text: 'No hard feelings 😄' });

    return interaction.editReply({ embeds: [embed], ephemeral: true });
  },
};
