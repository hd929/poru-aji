const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');

function parseTime(str) {
  const match = str.match(/^(\d+):(\d+)$/);
  if (match) return parseInt(match[1]) * 60000 + parseInt(match[2]) * 1000;
  const seconds = parseInt(str);
  return isNaN(seconds) ? null : seconds * 1000;
}

module.exports = {
  name: 'seek',
  description: 'Seek to a position in the current track',
  inVc: true,
  sameVc: true,
  player: true,
  current: true,
  options: [
    {
      name: 'time',
      type: ApplicationCommandOptionType.String,
      description: 'Time in mm:ss or seconds',
      required: true,
    },
  ],
  run: async (client, interaction) => {
    const player = client.poru.players.get(interaction.guild.id);
    const timeStr = interaction.options.getString('time', true);
    const timeMs = parseTime(timeStr);

    if (!timeMs || timeMs < 0) {
      return interaction.reply({ content: 'Invalid time format. Use mm:ss or seconds.', ephemeral: true });
    }

    if (!player.currentTrack?.info?.length) {
      return interaction.reply({ content: 'Cannot seek in this track.', ephemeral: true });
    }

    player.seekTo(timeMs);
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor('Green').setDescription(`⏩ Seeked to \`${timeStr}\`.`)],
      ephemeral: true,
    });
  },
};
