const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { recommendSongs } = require('../../utils/ai');
const { getTopTracksForGuild } = require('../../utils/db');

module.exports = {
  name: 'recommend',
  description: 'Get music recommendations based on top tracks or current vibe',
  inVc: true,
  sameVc: true,
  player: true,
  options: [
    {
      name: 'count',
      type: ApplicationCommandOptionType.Integer,
      description: 'Number of recommendations (1-10)',
      required: false,
      min_value: 1,
      max_value: 10,
    },
  ],
  run: async (client, interaction) => {
    const player = client.poru.players.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'No player exists.', ephemeral: true });

    const count = interaction.options.getInteger('count') || 5;

    await interaction.deferReply();

    let recommendations = [];
    let source = '';

    // 1. Try top tracks first
    const topTracks = await getTopTracksForGuild(player.guildId, 20);
    if (topTracks.length >= 3) {
      const titles = topTracks
        .filter(t => {
          const [title] = t.key.split('|||');
          return !player.queue.some(q => q.info.title.toLowerCase().includes(title.toLowerCase().substring(0, 20)));
        })
        .slice(0, count)
        .map(t => {
          const [title] = t.key.split('|||');
          return { title, artist: '', reason: 'Popular in this server' };
        });
      
      if (titles.length > 0) {
        recommendations = titles;
        source = 'Top Tracks';
      }
    }

    // 2. Fallback to AI if no top tracks
    if (recommendations.length === 0) {
      try {
        recommendations = await recommendSongs(player.currentTrack, player.queue, count);
        source = 'AI Recommendations';
      } catch (err) {
        console.error('[AI] Connection error, using smart fallback:', err.message);
      }
    }

    // 3. Fallback to smart fallback
    if (!recommendations || recommendations.length === 0) {
      recommendations = getSmartFallback(player, count);
      source = 'Smart Recommendations';
    }

    if (!recommendations || recommendations.length === 0) {
      return interaction.editReply({ content: 'Could not generate recommendations. Try again later.', ephemeral: true });
    }

    const node = client.poru.leastUsedNodes[0];
    const added = [];

    for (const rec of recommendations) {
      try {
        const searchQuery = rec.artist ? `${rec.title} ${rec.artist}` : rec.title;
        const response = await node.rest.get(`/v4/loadtracks?identifier=${encodeURIComponent(`scsearch:${searchQuery}`)}`);
        if (response?.loadType === 'search' && response.data?.length > 0) {
          const track = { track: response.data[0].encoded, info: response.data[0].info, requester: interaction.member };
          player.queue.add(track);
          added.push({ ...rec, uri: response.data[0].info.uri, title: response.data[0].info.title });
        }
      } catch (err) {
        console.error('[Recommend] Failed to load:', rec.title, err.message);
      }
    }

    if (added.length === 0) {
      return interaction.editReply({ content: 'Could not find any recommended songs on SoundCloud.', ephemeral: true });
    }

    const description = added
      .map((r, i) => `${i + 1}. [${r.title}](${r.uri})${r.reason ? `\n   *${r.reason}*` : ''}`)
      .join('\n\n');

    const embed = new EmbedBuilder()
      .setColor('Purple')
      .setAuthor({ name: source, iconURL: client.user.displayAvatarURL() })
      .setDescription(description)
      .setFooter({ text: `Added ${added.length} tracks to queue` });

    await interaction.editReply({ embeds: [embed], ephemeral: true });

    if (!player.isPlaying && !player.isPaused) {
      await player.play();
    }
  },
};

function getSmartFallback(player, count) {
  const queries = [];

  if (player.currentTrack?.info?.author) {
    queries.push({ title: player.currentTrack.info.author, artist: '', reason: 'Same artist' });
  }

  const genres = ['chill vibes', 'lofi hip hop', 'electronic music', 'indie pop', 'deep house mix', 'ambient music'];
  // Fisher-Yates shuffle (unbiased)
  for (let i = genres.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [genres[i], genres[j]] = [genres[j], genres[i]];
  }

  for (const genre of genres) {
    if (queries.length >= count) break;
    queries.push({ title: genre, artist: '', reason: `Similar vibe: ${genre}` });
  }

  return queries.slice(0, count);
}
