const { EmbedBuilder } = require('discord.js');

const RADIO_GENRES = [
  'scsearch:chill beats instrumental',
  'scsearch:lofi hip hop mix',
  'scsearch:ambient electronic',
  'scsearch:deep house chill',
  'scsearch:indie acoustic cover',
  'scsearch:jazz cafe background',
  'scsearch:synthwave retro',
  'scsearch:study music focus',
  'scsearch:relaxing piano music',
  'scsearch:night drive music',
  'scsearch:tropical house mix',
  'scsearch:future bass chill',
  'scsearch:downtempo electronic',
  'scsearch:chillout lounge',
  'scsearch:acoustic guitar instrumental',
  'scsearch:post rock instrumental',
  'scsearch:chillstep music',
  'scsearch:melodic dubstep',
  'scsearch:chillwave synth',
  'scsearch:ambient soundscape',
];

module.exports = {
  name: 'skip',
  description: 'Skip the current track',
  inVc: true,
  sameVc: true,
  player: true,
  run: async (client, interaction) => {
    const player = client.poru.players.get(interaction.guild.id);
    if (!player?.currentTrack) return interaction.reply({ content: 'Nothing to skip.', ephemeral: true });

    const currentTitle = player.currentTrack.info.title.substring(0, 50);

    if (player.radioMode) {
      const node = player.node;
      let loaded = 0;

      while (player.queue.length < 3 && loaded < 3) {
        const genre = RADIO_GENRES[player._radioGenreIndex % RADIO_GENRES.length];
        player._radioGenreIndex++;
        try {
          const res = await node.rest.get(`/v4/loadtracks?identifier=${encodeURIComponent(genre)}`);
          if (res?.loadType === 'search' && res.data?.length > 0) {
            const t = res.data[Math.floor(Math.random() * Math.min(res.data.length, 5))];
            player.queue.add({ track: t.encoded, info: t.info, requester: client.user });
            loaded++;
          }
        } catch {}
      }
    }

    player.stop();
    await player.play();

    const nextTrack = player.currentTrack?.info?.title?.substring(0, 50) || 'loading...';

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('Green')
          .setDescription(`⏭️ Skipped **${currentTitle}**\n▶️ Now: **${nextTrack}**`),
      ],
      ephemeral: true,
    });
  },
};
