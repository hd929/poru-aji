const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'help',
  description: 'Show all available commands',
  run: async (client, interaction) => {
    const embed = new EmbedBuilder()
      .setColor('Blurple')
      .setAuthor({ name: 'Aji Music - Commands', iconURL: client.user.displayAvatarURL() })
      .setDescription(
        `**🎵 Music**\n` +
        `\`/play <query/link>\` - Play a track (SoundCloud primary)\n` +
        `\`/next\` - Skip current track\n` +
        `\`/pause\` - Pause playback\n` +
        `\`/resume\` - Resume playback\n` +
        `\`/stop\` - Stop and clear queue\n` +
        `\`/seek <time>\` - Seek to position (mm:ss)\n` +
        `\`/volume [level]\` - Set volume (1-150%)\n` +
        `\`/loop <mode>\` - Loop off/track/queue\n` +
        `\`/shuffle\` - Shuffle the queue\n` +
        `\`/queue\` - View current queue\n` +
        `\`/nowplaying\` - Show current track with controls\n` +
        `\`/remove <pos>\` - Remove track from queue\n` +
        `\`/move <from> <to>\` - Move track in queue\n` +
        `\`/clearqueue\` - Clear the entire queue\n\n` +
        `**🔗 Connection**\n` +
        `\`/join\` - Join voice channel\n` +
        `\`/leave\` - Leave voice channel\n` +
        `\`/autoplay\` - Toggle autoplay mode\n` +
        `\`/radio\` - Start continuous genre radio\n\n` +
        `**🎤 Artist & Recent**\n` +
        `\`/artist <name> [count]\` - Play tracks by artist\n` +
        `\`/recent\` - Play recently played tracks\n\n` +
        `**🤖 AI DJ**\n` +
        `\`/recommend [count]\` - AI recommends similar songs\n` +
        `\`/mood <vibe>\` - AI creates mood playlist\n` +
        `\`/why\` - AI explains why this song fits\n` +
        `\`/summarizequeue\` - AI describes queue vibe\n` +
        `\`/roasttaste\` - AI roasts your music taste\n\n` +
        `**📊 Info**\n` +
        `\`/toptracks\` - Most played tracks in server\n` +
        `\`/ping\` - Bot latency\n` +
        `\`/help\` - Show this message\n` +
        `\`/clear [amount]\` - Clear bot messages only\n\n` +
        `**💡 Tips:**\n` +
        `• Use \`/play\` autocomplete to find songs\n` +
        `• Buttons under /nowplaying for quick controls\n` +
        `• Volume saved per server, max 150%\n` +
        `• Radio mode plays continuously without stopping`,
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
