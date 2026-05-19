const { EmbedBuilder } = require('discord.js');
const { getServerSetting } = require('../../utils/settings');

module.exports = {
  name: 'join',
  description: 'Join your voice channel',
  inVc: true,
  run: async (client, interaction) => {
    const existing = client.poru.players.get(interaction.guild.id);
    if (existing) {
      return interaction.reply({ content: 'Already in a voice channel. Use `/leave` first.', ephemeral: true });
    }

    const player = client.poru.createConnection({
      guildId: interaction.guild.id,
      voiceChannel: interaction.member.voice.channel.id,
      textChannel: interaction.channel.id,
      deaf: true,
    });

    player.autoplay = false;
    player.radioMode = false;

    const savedVol = await getServerSetting(interaction.guild.id, 'volume', 100);
    player.setVolume(savedVol);

    return interaction.reply({
      embeds: [new EmbedBuilder().setColor('Green').setDescription(`Joined **${interaction.member.voice.channel.name}**. Use /play to add tracks.`)],
      ephemeral: true,
    });
  },
};
