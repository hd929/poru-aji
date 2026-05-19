const { ApplicationCommandOptionType, EmbedBuilder, InteractionType } = require('discord.js');
const { isYoutubeLink, getDirectUrl } = require('../../utils/ytdlp');

function formatDuration(ms) {
  if (!ms || ms === 0) return 'Live';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

async function loadTrack(node, identifier) {
  const res = await node.rest.get(`/v4/loadtracks?identifier=${encodeURIComponent(identifier)}`);
  return res;
}

async function trySoundCloudFallback(node, query) {
  const response = await loadTrack(node, `scsearch:${query}`);
  if (response?.loadType === 'search' && response.data?.length > 0) {
    return { source: 'soundcloud', response, query };
  }
  return null;
}

module.exports = {
  name: 'play',
  description: 'Play a track from YouTube or SoundCloud',
  inVc: true,
  sameVc: true,
  options: [
    {
      name: 'query',
      type: ApplicationCommandOptionType.String,
      description: 'Song name or URL',
      required: true,
      autocomplete: true,
    },
  ],
  run: async (client, interaction) => {
    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      const focused = interaction.options.getFocused();
      if (!focused || focused.length < 2) return interaction.respond([]);

      const node = client.poru.leastUsedNodes[0];
      if (!node) return interaction.respond([]);

      try {
        const response = await loadTrack(node, `scsearch:${focused}`);
        if (response?.loadType === 'search' && response.data?.length > 0) {
          const results = response.data.slice(0, 5).map(t => ({
            name: `${t.info.title.substring(0, 80)} [${formatDuration(t.info.length)}]`,
            value: t.info.uri,
          }));
          return interaction.respond(results);
        }
      } catch {
        // ignore autocomplete errors
      }
      return interaction.respond([]);
    }

    const player = client.poru.createConnection({
      guildId: interaction.guildId,
      voiceChannel: interaction.member.voice.channelId,
      textChannel: interaction.channel.id,
      deaf: true,
    });

    player.autoplay = false;
    player.radioMode = false;

    const query = interaction.options.getString('query', true);
    const node = client.poru.leastUsedNodes[0];
    if (!node) return interaction.reply({ content: 'No Lavalink node available.', ephemeral: true });

    await interaction.deferReply().catch(() => {});

    let response = null;
    let sourceName = '';

    try {
      const isUrl = query.startsWith('http://') || query.startsWith('https://');

      if (isUrl && isYoutubeLink(query)) {
        console.log('[Play] YouTube link, trying Lavalink first...');
        response = await loadTrack(node, query);

        if (response?.loadType === 'empty' || response?.loadType === 'error') {
          console.log('[Play] Lavalink failed, trying yt-dlp fallback...');
          const directUrl = getDirectUrl(query);
          if (directUrl) {
            response = await loadTrack(node, directUrl);
            sourceName = 'youtube (yt-dlp)';
          }
        }

        if (response?.loadType === 'empty' || response?.loadType === 'error') {
          console.log('[Play] All YouTube methods failed, falling back to SoundCloud...');
          const scResult = await trySoundCloudFallback(node, query.split('v=')[1] || query);
          if (scResult) {
            response = scResult.response;
            sourceName = 'soundcloud (fallback)';
          }
        }

        if (!sourceName) sourceName = 'youtube';
      } else if (isUrl) {
        response = await loadTrack(node, query);
        sourceName = 'direct';
      } else {
        response = await loadTrack(node, `scsearch:${query}`);
        sourceName = 'soundcloud';
      }
    } catch (err) {
      console.error('[Play] Error:', err);
      return interaction.editReply({ content: `Error: ${err.message}`, ephemeral: true });
    }

    if (!response || response.loadType === 'empty') {
      return interaction.editReply({ content: 'No results found. Try a different query.', ephemeral: true });
    }

    const tracks = [];
    if (response.loadType === 'track') {
      tracks.push({ track: response.data.encoded, info: response.data.info, requester: interaction.member });
    } else if (response.loadType === 'search') {
      for (const t of response.data) {
        tracks.push({ track: t.encoded, info: t.info, requester: interaction.member });
      }
    } else if (response.loadType === 'playlist') {
      for (const t of response.data.tracks) {
        tracks.push({ track: t.encoded, info: t.info, requester: interaction.member });
      }
    }

    if (tracks.length === 0) {
      return interaction.editReply({ content: 'No results found.', ephemeral: true });
    }

    if (response.loadType === 'playlist') {
      for (const track of tracks) {
        player.queue.add(track);
      }
      const embed = new EmbedBuilder()
        .setColor('Green')
        .setDescription(`Added \`${tracks.length}\` tracks from **${response.data.info.name}**`);
      await interaction.editReply({ embeds: [embed], ephemeral: true });
      if (!player.isPlaying && !player.isPaused) return player.play();
    } else {
      const track = tracks[0];
      player.queue.add(track);

      const embed = new EmbedBuilder()
        .setColor('Green')
        .setAuthor({ name: 'Added to queue', iconURL: interaction.member.displayAvatarURL() })
        .setTitle(track.info.title.substring(0, 100))
        .setURL(track.info.uri)
        .addFields(
          { name: 'Author', value: track.info.author || 'Unknown', inline: true },
          { name: 'Duration', value: formatDuration(track.info.length), inline: true },
          { name: 'Source', value: sourceName, inline: true },
        );

      await interaction.editReply({ embeds: [embed], ephemeral: true });

      if (player.isPlaying || player.isPaused) {
        console.log('[Play] Track queued.');
      } else {
        if (!player.isConnected) {
          for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 200));
            if (player.isConnected) break;
          }
        }
        await player.play();
      }
    }
  },
};
