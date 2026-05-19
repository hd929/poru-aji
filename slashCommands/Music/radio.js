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
  name: 'radio',
  description: 'Start AI radio mode - continuous music recommendations',
  inVc: true,
  sameVc: true,
  run: async (client, interaction) => {
    const existing = client.poru.players.get(interaction.guildId);
    if (existing) {
      existing.radioMode = true;
      existing.autoplay = true;
      existing._radioErrors = 0;
      if (existing._radioGenreIndex === undefined) existing._radioGenreIndex = 0;

      if (existing.queue.length < 3) {
        const node = existing.node;
        const loaded = await loadRadioBatch(existing, node, 3);
        if (loaded > 0 && !existing.isPlaying && !existing.isPaused) {
          await existing.play();
        }
      }

      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('Purple').setDescription('📻 Radio mode enabled!')],
        ephemeral: true,
      });
    }

    const player = client.poru.createConnection({
      guildId: interaction.guildId,
      voiceChannel: interaction.member.voice.channelId,
      textChannel: interaction.channel.id,
      deaf: true,
    });

    await interaction.deferReply();

    player.radioMode = true;
    player.autoplay = true;
    player._radioGenreIndex = 0;
    player._radioErrors = 0;

    const node = client.poru.leastUsedNodes[0];
    if (!node) return interaction.editReply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ No Lavalink node available.')], ephemeral: true });

    const loaded = await loadRadioBatch(player, node, 3);

    if (loaded === 0) {
      player.destroy();
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Could not load any tracks.')], ephemeral: true });
    }

    await player.play();

    interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor('Purple')
          .setAuthor({ name: 'AI Radio', iconURL: client.user.displayAvatarURL() })
          .setDescription(`📻 Radio started! Loaded **${loaded}** tracks. Music plays continuously.\nUse \`/stop\` to end.`),
      ],
      ephemeral: true,
    });
  },
};

async function loadRadioBatch(player, node, count) {
  let loaded = 0;

  for (let i = 0; i < count; i++) {
    if (!player.radioMode) break;
    const genre = RADIO_GENRES[player._radioGenreIndex % RADIO_GENRES.length];
    player._radioGenreIndex++;

    try {
      const res = await node.rest.get(`/v4/loadtracks?identifier=${encodeURIComponent(genre)}`);
      if (res?.loadType === 'search' && res.data?.length > 0) {
        const randomIdx = Math.floor(Math.random() * Math.min(res.data.length, 5));
        const t = res.data[randomIdx];
        player.queue.add({ track: t.encoded, info: t.info, requester: client.user });
        loaded++;
      }
    } catch (err) {
      console.error('[Radio load] Error:', err.message);
    }
  }

  console.log(`[Radio] Loaded ${loaded} tracks. Queue now: ${player.queue.length}`);
  return loaded;
}
