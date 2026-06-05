const { ApplicationCommandOptionType, EmbedBuilder, InteractionType } = require('discord.js');
const { formatDuration } = require('../../utils/musicUtils');
const { loadTrack, searchWithFallback, DEFAULT_SEARCH_SOURCES } = require('../../utils/loadTrack');

module.exports = {
  name: 'play',
  description: 'Play any track (SoundCloud → Bandcamp → YouTube)',
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
      if (!focused || focused.length < 2) {
        try {
          const { getTopTracksForGuild } = require('../../utils/db');
          const topTracks = await getTopTracksForGuild(interaction.guildId, 10);
          if (topTracks.length > 0) {
            const choices = topTracks.map(t => {
              const [title, uri] = t.key.split('|||');
              return {
                name: `🔥 ${title.substring(0, 80)}`,
                value: uri && uri.length > 100 ? title.substring(0, 100) : (uri || 'Unknown'),
              };
            });
            return interaction.respond(choices);
          }
        } catch {}
        return interaction.respond([]);
      }

      const node = client.poru.leastUsedNodes[0];
      if (!node) return interaction.respond([]);

      try {
        const response = await loadTrack(node, `scsearch:${focused}`);
        console.log(`[Autocomplete Debug] Query: "${focused}", loadType: "${response?.loadType}", data length: ${response?.data?.length || 0}`);
        if (response?.loadType === 'search' && response.data?.length > 0) {
          const results = response.data.slice(0, 25).map(t => {
            const title = t.info.title || 'Unknown';
            const uri = t.info.uri || '';
            return {
              name: `🎵 ${title.substring(0, 75)} [${formatDuration(t.info.length)}]`,
              value: uri.length > 100 ? title.substring(0, 100) : uri,
            };
          });
          console.log(`[Autocomplete Debug] Responding with ${results.length} results.`);
          return interaction.respond(results);
        } else {
          console.log(`[Autocomplete Debug] Non-search response or empty data:`, response);
        }
      } catch (err) {
        console.error(`[Autocomplete Debug] Error:`, err);
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

      if (isUrl) {
        console.log('[Play] Loading URL directly...');
        response = await loadTrack(node, query);

        if (!response || response.loadType === 'empty' || response.loadType === 'error') {
          console.log('[Play] Direct URL failed, searching...');
          const searchResult = await searchWithFallback(node, query, DEFAULT_SEARCH_SOURCES);
          if (searchResult) {
            response = searchResult.response;
            sourceName = searchResult.source;
          }
        } else {
          const info = response.data?.info || {};
          sourceName = info.sourceName || 'direct';
        }
      } else {
        const searchResult = await searchWithFallback(node, query, DEFAULT_SEARCH_SOURCES);
        if (searchResult) {
          response = searchResult.response;
          sourceName = searchResult.source;
        }
      }
    } catch (err) {
      console.error('[Play] Error:', err);
      return interaction.editReply({ content: `Error: ${err.message}`, ephemeral: true });
    }

    if (!response || response.loadType === 'empty') {
      return interaction.editReply({ content: 'No results found on any source.', ephemeral: true });
    }

    const tracks = [];
    if (response.loadType === 'track' && response.data?.encoded) {
      tracks.push({ track: response.data.encoded, info: response.data.info || {}, requester: interaction.member });
    } else if (response.loadType === 'search' && Array.isArray(response.data)) {
      for (const t of response.data) {
        if (t?.encoded) tracks.push({ track: t.encoded, info: t.info || {}, requester: interaction.member });
      }
    } else if (response.loadType === 'playlist' && Array.isArray(response.data?.tracks)) {
      for (const t of response.data.tracks) {
        if (t?.encoded) tracks.push({ track: t.encoded, info: t.info || {}, requester: interaction.member });
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
          if (!player.isConnected) {
            return interaction.editReply({ content: 'Failed to connect to voice channel.', ephemeral: true });
          }
        }
        await player.play();
      }
    }
  },
};
