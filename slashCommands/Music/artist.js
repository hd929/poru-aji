const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const { formatDuration } = require('../../utils/musicUtils');

module.exports = {
  name: 'artist',
  description: 'Play music from a specific artist',
  inVc: true,
  sameVc: true,
  options: [
    {
      name: 'name',
      type: ApplicationCommandOptionType.String,
      description: 'Artist name',
      required: true,
      autocomplete: true,
    },
    {
      name: 'count',
      type: ApplicationCommandOptionType.Integer,
      description: 'Number of tracks to play (1-10, default 5)',
      required: false,
      min_value: 1,
      max_value: 10,
    },
  ],
  run: async (client, interaction) => {
    if (interaction.type === 4) {
      const focused = interaction.options.getFocused();
      if (!focused || focused.length < 2) return interaction.respond([]);

      const node = client.poru.leastUsedNodes[0];
      if (!node) return interaction.respond([]);

      try {
        const res = await node.rest.get(`/v4/loadtracks?identifier=${encodeURIComponent(`scsearch:${focused}`)}`);
        if (res?.loadType === 'search' && res.data?.length > 0) {
          const authors = res.data.map(t => t.info.author);
          const uniqueAuthors = [...new Set(authors)];
          const results = uniqueAuthors.slice(0, 25).map(author => {
            const cleanAuthor = author || 'Unknown';
            return {
              name: `🎤 ${cleanAuthor.substring(0, 80)}`,
              value: cleanAuthor.substring(0, 100),
            };
          });
          return interaction.respond(results);
        }
      } catch {
        // ignore autocomplete errors
      }
      return interaction.respond([]);
    }

    const artistName = interaction.options.getString('name', true);
    const count = interaction.options.getInteger('count') || 5;

    await interaction.deferReply();

    const existing = client.poru.players.get(interaction.guildId);
    if (!existing) {
      const player = client.poru.createConnection({
        guildId: interaction.guildId,
        voiceChannel: interaction.member.voice.channelId,
        textChannel: interaction.channel.id,
        deaf: true,
      });
      player.autoplay = false;
      player.radioMode = false;
    }

    const player = client.poru.players.get(interaction.guildId);
    const node = client.poru.leastUsedNodes[0];
    if (!node) return interaction.editReply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ No Lavalink node available.')], ephemeral: true });

    try {
      const res = await node.rest.get(`/v4/loadtracks?identifier=${encodeURIComponent(`scsearch:${artistName}`)}`);

      if (!res || res.loadType === 'empty') {
        return interaction.editReply({ embeds: [new EmbedBuilder().setColor('Red').setDescription(`No tracks found for **${artistName}**.`)], ephemeral: true });
      }

      let tracks = [];
      if (res.loadType === 'track') {
        tracks = [{ track: res.data.encoded, info: res.data.info, requester: interaction.member }];
      } else if (res.loadType === 'search') {
        const normalizedArtist = artistName.toLowerCase().trim();
        const filtered = res.data.filter(t => {
          const author = (t.info.author || '').toLowerCase().trim();
          return author === normalizedArtist || author.startsWith(normalizedArtist + ' ') || author.includes(' ' + normalizedArtist + ' ') || author.endsWith(' ' + normalizedArtist);
        });
        tracks = (filtered.length > 0 ? filtered : res.data).slice(0, count).map(t => ({
          track: t.encoded,
          info: t.info,
          requester: interaction.member,
        }));
      } else if (res.loadType === 'playlist') {
        tracks = res.data.tracks.slice(0, count).map(t => ({
          track: t.encoded,
          info: t.info,
          requester: interaction.member,
        }));
      }

      if (tracks.length === 0) {
        return interaction.editReply({ embeds: [new EmbedBuilder().setColor('Red').setDescription(`No tracks found for **${artistName}**.`)], ephemeral: true });
      }

      for (const track of tracks) {
        player.queue.add(track);
      }

      const embed = new EmbedBuilder()
        .setColor('Green')
        .setAuthor({ name: 'Artist Radio', iconURL: interaction.member.displayAvatarURL() })
        .setTitle(`🎤 ${artistName}`)
        .setDescription(`Added **${tracks.length}** tracks to queue.`)
        .addFields(
          tracks.slice(0, 5).map((t, i) => ({
            name: `${i + 1}. ${t.info.title.substring(0, 80)}`,
            value: `${t.info.author} • ${formatDuration(t.info.length)}`,
            inline: false,
          }))
        );

      if (tracks.length > 5) {
        embed.setFooter({ text: `...and ${tracks.length - 5} more tracks` });
      }

      await interaction.editReply({ embeds: [embed], ephemeral: true });

      if (!player.isPlaying && !player.isPaused) {
        if (!player.isConnected) {
          for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 200));
            if (player.isConnected) break;
          }
        }
        await player.play();
      }
    } catch (err) {
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor('Red').setDescription(`Error: ${err.message}`)], ephemeral: true });
    }
  },
};
