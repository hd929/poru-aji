const { ApplicationCommandOptionType, EmbedBuilder, InteractionType } = require('discord.js');
const { getRecentTracks, incrementTrack } = require('../../utils/db');
const { formatDuration } = require('../../utils/musicUtils');

module.exports = {
  name: 'recent',
  description: 'Play from recently played tracks',
  inVc: true,
  sameVc: true,
  options: [
    {
      name: 'query',
      type: ApplicationCommandOptionType.String,
      description: 'Search recent tracks',
      required: false,
      autocomplete: true,
    },
  ],
  run: async (client, interaction) => {
    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      const focused = interaction.options.getFocused();
      const recent = await getRecentTracks(interaction.guildId, 25);

      let results = recent.map(doc => {
        const [title, uri] = doc.key.split('|||');
        return { title, uri, count: doc.count, lastPlayed: doc.lastPlayed };
      });

      if (focused) {
        results = results.filter(r => r.title.toLowerCase().includes(focused.toLowerCase()));
      }

      const choices = results.slice(0, 25).map(r => ({
        name: `${r.title.substring(0, 80)} (${r.count} plays)`,
        value: r.uri,
      }));

      return interaction.respond(choices);
    }

    const query = interaction.options.getString('query');

    const player = client.poru.players.get(interaction.guildId);
    if (!player) {
      return interaction.reply({ content: 'No player exists. Use `/join` first.', ephemeral: true });
    }

    await interaction.deferReply();

    const node = client.poru.leastUsedNodes[0];
    if (!node) return interaction.editReply({ content: 'No Lavalink node available.', ephemeral: true });

    let response;
    if (query) {
      response = await node.rest.get(`/v4/loadtracks?identifier=${encodeURIComponent(query)}`);
    } else {
      const recent = await getRecentTracks(interaction.guildId, 1);
      if (recent.length === 0) {
        return interaction.editReply({ content: 'No recent tracks found.', ephemeral: true });
      }
      const [, uri] = recent[0].key.split('|||');
      response = await node.rest.get(`/v4/loadtracks?identifier=${encodeURIComponent(uri)}`);
    }

    if (!response || response.loadType === 'empty') {
      return interaction.editReply({ content: 'Track not found.', ephemeral: true });
    }

    const trackData = response.loadType === 'track' ? response.data : response.data[0];
    const track = { track: trackData.encoded, info: trackData.info, requester: interaction.member };
    player.queue.add(track);

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setAuthor({ name: 'Added from recent', iconURL: interaction.member.displayAvatarURL() })
      .setTitle(track.info.title.substring(0, 100))
      .setURL(track.info.uri)
      .addFields(
        { name: 'Author', value: track.info.author || 'Unknown', inline: true },
        { name: 'Duration', value: formatDuration(track.info.length), inline: true },
      );

    await interaction.editReply({ embeds: [embed], ephemeral: true });

    if (!player.isPlaying && !player.isPaused) {
      await player.play();
    }
  },
};
