const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'autoplay',
  description: 'Toggle autoplay mode',
  inVc: true,
  sameVc: true,
  run: async (client, interaction) => {
    const player = client.poru.players.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'No player exists. Use `/join` first.', ephemeral: true });

    player.autoplay = !player.autoplay;
    if (player.autoplay) player.radioMode = false;

    const embed = new EmbedBuilder()
      .setColor(player.autoplay ? 'Green' : 'Red')
      .setDescription(`Autoplay is now **${player.autoplay ? 'enabled' : 'disabled'}**.`);

    if (player.autoplay && !player.isPlaying && !player.isPaused) {
      if (player.queue.length === 0) {
        const node = client.poru.leastUsedNodes[0];
        try {
          const response = await node.rest.get(`/v4/loadtracks?identifier=${encodeURIComponent('scsearch:popular music')}`);
          if (response?.loadType === 'search' && response.data?.length > 0) {
            const tracks = response.data.slice(0, 5);
            const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
            const track = { track: randomTrack.encoded, info: randomTrack.info, requester: client.user };
            player.queue.add(track);
            await player.play();
          }
        } catch (err) {
          console.error('[Autoplay start] Error:', err.message);
        }
      } else {
        await player.play();
      }
    }

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
