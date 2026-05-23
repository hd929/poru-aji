const { EmbedBuilder } = require('discord.js');
const { roastTaste } = require('../../utils/ai');

module.exports = {
  name: 'roasttaste',
  description: 'Algorithm roasts your music taste (fun)',
  inVc: true,
  run: async (client, interaction) => {
    const player = client.poru.players.get(interaction.guild.id);

    await interaction.deferReply();

    const queue = player?.queue || [];
    let roast;
    try {
      roast = await roastTaste(queue);
    } catch (err) {
      console.error('[Algorithm] Logic error:', err.message);
      return interaction.editReply({ content: 'Algorithm error.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('DarkRed')
      .setAuthor({ name: 'Algorithm Roast', iconURL: client.user.displayAvatarURL() })
      .setDescription(roast)
      .setFooter({ text: 'No hard feelings 😄' });

    return interaction.editReply({ embeds: [embed], ephemeral: true });
  },
};
