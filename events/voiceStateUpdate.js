module.exports.run = (client, oldVoice, newVoice) => {
  const player = client.poru.players.get(oldVoice.guild.id);
  if (!player) return;

  const botChannel = newVoice.guild.members.me?.voice?.channelId;
  if (!botChannel) {
    player.destroy();
    return;
  }

  const membersInChannel = newVoice.guild.members.me.voice.channel?.members.filter(m => !m.user.bot);
  if (membersInChannel?.size === 0) {
    if (player._emptyTimeout) return;

    player._emptyTimeout = setTimeout(() => {
      player._emptyTimeout = null;
      player.autoplay = false;
      player.destroy();
    }, 5 * 60 * 1000);
  } else {
    if (player._emptyTimeout) {
      clearTimeout(player._emptyTimeout);
      player._emptyTimeout = null;
    }
  }
};
