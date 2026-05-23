const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { moodPlaylist } = require('../../utils/ai');

module.exports = {
  name: 'mood',
  description: 'Create a playlist based on a mood',
  inVc: true,
  sameVc: true,
  player: true,
  options: [
    {
      name: 'vibe',
      type: ApplicationCommandOptionType.String,
      description: 'The mood (e.g. sad, gym, nightdrive, chill, hype)',
      required: true,
    },
    {
      name: 'count',
      type: ApplicationCommandOptionType.Integer,
      description: 'Number of songs (1-10)',
      required: false,
      min_value: 1,
      max_value: 10,
    },
  ],
  run: async (client, interaction) => {
    const player = client.poru.players.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'No player exists. Use `/join` first.', ephemeral: true });

    const vibe = interaction.options.getString('vibe', true);
    const count = interaction.options.getInteger('count') || 5;

    await interaction.deferReply();

    let songs;
    try {
      songs = await moodPlaylist(vibe, count);
    } catch (err) {
      console.error('[Algorithm] Logic error:', err.message);
      return interaction.editReply({ content: 'Algorithm error. Please use `/play` to search manually.', ephemeral: true });
    }

    if (songs.length === 0) {
      return interaction.editReply({ content: 'Algorithm could not generate a playlist.', ephemeral: true });
    }

    const node = client.poru.leastUsedNodes[0];
    const added = [];

    for (const song of songs) {
      try {
        const response = await node.rest.get(`/v4/loadtracks?identifier=${encodeURIComponent(`scsearch:${song.title} ${song.artist}`)}`);
        if (response?.loadType === 'search' && response.data?.length > 0) {
          const track = { track: response.data[0].encoded, info: response.data[0].info, requester: interaction.member };
          player.queue.add(track);
          added.push({ ...song, uri: response.data[0].info.uri, title: response.data[0].info.title });
        }
      } catch (err) {
        console.error('[Mood] Failed to load:', song.title, err.message);
      }
    }

    if (added.length === 0) {
      return interaction.editReply({ content: 'Could not find any of the mood songs on SoundCloud.', ephemeral: true });
    }

    const description = added
      .map((r, i) => `${i + 1}. [${r.title}](${r.uri})\n   *${r.reason}*`)
      .join('\n\n');

    const embed = new EmbedBuilder()
      .setColor('Purple')
      .setAuthor({ name: `Mood: ${vibe}`, iconURL: client.user.displayAvatarURL() })
      .setDescription(description)
      .setFooter({ text: `Added ${added.length} tracks to queue` });

    await interaction.editReply({ embeds: [embed], ephemeral: true });

    if (!player.isPlaying && !player.isPaused) {
      await player.play();
    }
  },
};
