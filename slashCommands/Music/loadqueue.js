const { EmbedBuilder, ApplicationCommandOptionType, InteractionType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const SAVES_DIR = path.join(__dirname, '../../data/savedQueues');

function getSavePath(guildId, name) {
  return path.join(SAVES_DIR, `${guildId}-${name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50)}.json`);
}

function listSavedQueues(guildId) {
  if (!fs.existsSync(SAVES_DIR)) return [];
  return fs.readdirSync(SAVES_DIR)
    .filter(f => f.startsWith(`${guildId}-`))
    .map(f => f.replace(`${guildId}-`, '').replace('.json', ''));
}

module.exports = {
  name: 'loadqueue',
  description: 'Load a previously saved queue',
  inVc: true,
  sameVc: true,
  options: [
    {
      name: 'name',
      type: ApplicationCommandOptionType.String,
      description: 'Name of the saved queue to load',
      required: true,
      autocomplete: true,
    },
  ],
  run: async (client, interaction) => {
    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
const saved = listSavedQueues(interaction.guildId);
       const focused = interaction.options.getFocused() || '';
      const filtered = saved.filter(s => s.toLowerCase().includes(focused.toLowerCase())).slice(0, 25);
      return interaction.respond(filtered.map(s => ({
        name: s.substring(0, 100),
        value: s.substring(0, 100),
      })));
    }

    const name = interaction.options.getString('name', true).trim();
    const player = client.poru.players.get(interaction.guildId);

    if (!player) {
      return interaction.reply({ content: '❌ No player exists. Use `/join` first.', ephemeral: true });
    }

    const savePath = getSavePath(interaction.guildId, name);
    if (!fs.existsSync(savePath)) {
      return interaction.reply({ content: `❌ Saved queue \`${name}\` not found.`, ephemeral: true });
    }

    let data;
    try {
      data = JSON.parse(fs.readFileSync(savePath, 'utf8'));
    } catch {
      return interaction.reply({ content: '❌ Failed to load saved queue.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const node = client.poru.leastUsedNodes[0];
    if (!node) return interaction.editReply({ content: '❌ No Lavalink node available.', ephemeral: true });

    let added = 0;
    let failed = 0;

    for (const trackData of data.tracks) {
      try {
        const response = await node.rest.get(`/v4/loadtracks?identifier=${encodeURIComponent(`scsearch:${trackData.title} ${trackData.author || ''}`)}`);
        if (response?.loadType === 'search' && response.data?.length > 0) {
          const match = response.data.find(t => t.info.title.toLowerCase().includes(trackData.title.toLowerCase().substring(0, 20))) || response.data[0];
          player.queue.add({ track: match.encoded, info: match.info, requester: interaction.member });
          added++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    if (!player.isPlaying && !player.isPaused && player.queue.length > 0) {
      await player.play();
    }

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('📋 Queue Loaded')
      .setDescription(`Loaded \`${added}\`/${data.trackCount} tracks from \`${name}\``);
    if (failed > 0) {
      embed.addFields({ name: 'Failed tracks', value: `\`${failed}\` could not be resolved`, inline: true });
    }

    return interaction.editReply({ embeds: [embed], ephemeral: true });
  },
};