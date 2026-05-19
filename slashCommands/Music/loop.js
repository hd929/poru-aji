const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');

module.exports = {
  name: 'loop',
  description: 'Set loop mode for the music player',
  inVc: true,
  sameVc: true,
  player: true,
  options: [
    {
      name: 'mode',
      type: ApplicationCommandOptionType.String,
      description: 'Loop mode to set',
      required: true,
      choices: [
        { name: 'Off', value: 'none' },
        { name: 'Track', value: 'track' },
        { name: 'Queue', value: 'queue' },
      ],
    },
  ],
  run: async (client, interaction) => {
    const player = client.poru.players.get(interaction.guildId);
    const loopMode = interaction.options.getString('mode');

    if (!player) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ No music player found!')],
        ephemeral: true,
      });
    }

    const loopMap = { none: 'NONE', track: 'TRACK', queue: 'QUEUE' };
    const loopEmojis = { none: '🔁', track: '🔂', queue: '🔁' };
    const loopTexts = { none: 'disabled', track: 'current track', queue: 'entire queue' };

    player.setLoop(loopMap[loopMode]);

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle(`${loopEmojis[loopMode]} Loop Mode Changed`)
      .setDescription(`Loop is now set to **${loopTexts[loopMode]}**`)
      .addFields({ name: '👤 Changed by', value: interaction.user.toString(), inline: true })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
