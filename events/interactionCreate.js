const { InteractionType, EmbedBuilder } = require('discord.js');
const { createNowPlayingEmbed, createMusicButtons, createDisabledButtons, isOnCooldown } = require('../utils/musicUtils');

module.exports.run = async (client, interaction) => {
  if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.run(client, interaction);
    } catch (err) {
      console.error('Autocomplete error:', err.message);
    }
    return;
  }

  if (interaction.type === InteractionType.MessageComponent) {
    if (!interaction.customId.startsWith('music_') && !interaction.customId.startsWith('queue_')) return;

    const player = client.poru.players.get(interaction.guildId);

    if (interaction.customId.startsWith('queue_')) {
      if (!player) return interaction.reply({ content: 'No player found.', ephemeral: true });
      const { createQueueEmbed, createQueueButtons } = require('../utils/musicUtils');
      let page = parseInt(interaction.message.embeds[0]?.footer?.text?.match(/Page (\d+)/)?.[1] || '1') - 1;

      switch (interaction.customId) {
        case 'queue_prev':
          page = Math.max(0, page - 1);
          break;
        case 'queue_next':
          const totalPages = Math.ceil(player.queue.length / 10);
          page = Math.min(totalPages - 1, page + 1);
          break;
        case 'queue_close':
          return interaction.deleteReply?.() || interaction.reply({ content: 'Closed.', ephemeral: true });
      }

      const embed = createQueueEmbed(player, page);
      const buttons = createQueueButtons(page, Math.ceil(player.queue.length / 10));
      return interaction.update({ embeds: [embed], components: [buttons] });
    }

    if (!player) {
      return interaction.reply({ content: 'No player found.', ephemeral: true });
    }

    const memberChannel = interaction.member?.voice?.channelId;
    const botChannel = interaction.guild.members.me?.voice?.channelId;
    if (!memberChannel || botChannel !== memberChannel) {
      return interaction.reply({ content: 'You must be in the same voice channel.', ephemeral: true });
    }

    if (isOnCooldown(interaction.user.id)) {
      return interaction.reply({ content: '⏳ Please wait a moment before clicking again.', ephemeral: true });
    }

    try {
      switch (interaction.customId) {
        case 'music_prev':
          if (player.previousTracks && player.previousTracks.length > 0) {
            const prev = player.previousTracks.pop();
            player.queue.unshift(prev);
            player.stop();
            interaction.reply({ content: '⏮️ Playing previous track.', ephemeral: true });
          } else {
            interaction.reply({ content: 'No previous track available.', ephemeral: true });
          }
          break;

        case 'music_pause':
          if (player.isPaused) {
            player.pause(false);
            interaction.reply({ content: '▶️ Resumed.', ephemeral: true });
          } else {
            player.pause(true);
            interaction.reply({ content: '⏸️ Paused.', ephemeral: true });
          }
          break;

        case 'music_skip':
          if (player.queue.length > 0) {
            player.stop();
            interaction.reply({ content: '⏭️ Skipped.', ephemeral: true });
          } else {
            interaction.reply({ content: 'No tracks in queue to skip to.', ephemeral: true });
          }
          break;

        case 'music_stop':
          player.autoplay = false;
          player.radioMode = false;
          player.destroy();
          interaction.reply({ content: '⏹️ Stopped and disconnected.', ephemeral: true });
          break;

        case 'music_refresh':
          if (!player.currentTrack) {
            return interaction.reply({ content: 'Nothing is playing.', ephemeral: true });
          }
          const embed = createNowPlayingEmbed(player.currentTrack, player);
          const buttons = createMusicButtons(player.isPaused, player.loop || 'NONE');
          interaction.update({ embeds: [embed], components: buttons });
          break;

        case 'music_vol_down':
          const volDown = Math.max(0, player.volume - 10);
          player.setVolume(volDown);
          interaction.reply({ content: `🔉 Volume: **${volDown}%**`, ephemeral: true });
          break;

        case 'music_vol_up':
          const volUp = Math.min(150, player.volume + 10);
          player.setVolume(volUp);
          interaction.reply({ content: `🔊 Volume: **${volUp}%**`, ephemeral: true });
          break;

        case 'music_shuffle':
          if (player.queue.length < 2) {
            return interaction.reply({ content: 'Need at least 2 tracks to shuffle.', ephemeral: true });
          }
          for (let i = player.queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [player.queue[i], player.queue[j]] = [player.queue[j], player.queue[i]];
          }
          interaction.reply({ content: '🔀 Queue shuffled.', ephemeral: true });
          break;

        case 'music_loop':
          const loopOrder = ['NONE', 'TRACK', 'QUEUE'];
          const currentIdx = loopOrder.indexOf(player.loop || 'NONE');
          const nextLoop = loopOrder[(currentIdx + 1) % loopOrder.length];
          player.setLoop(nextLoop);
          const loopLabels = { NONE: 'Off', TRACK: 'Track', QUEUE: 'Queue' };
          interaction.reply({ content: `🔁 Loop set to: **${loopLabels[nextLoop]}**`, ephemeral: true });
          break;

        case 'music_queue':
          const { createQueueEmbed: createQEmbed, createQueueButtons: createQButtons } = require('../utils/musicUtils');
          const qEmbed = createQEmbed(player, 0);
          const qButtons = createQButtons(0, Math.ceil(player.queue.length / 10));
          interaction.reply({ embeds: [qEmbed], components: [qButtons], ephemeral: true });
          break;
      }
    } catch (err) {
      if (!interaction.replied) {
        interaction.reply({ content: 'Error: ' + err.message, ephemeral: true });
      }
    }
    return;
  }

  if (interaction.type !== InteractionType.ApplicationCommand) return;
  if (!interaction.guild) return;

  const command = client.slashCommands.get(interaction.commandName);
  if (!command) return;

  try {
    const player = client.poru.players.get(interaction.guild.id);
    const memberChannel = interaction.member?.voice?.channelId;
    const botChannel = interaction.guild.members.me?.voice?.channelId;

    if (command.inVc && !memberChannel) {
      return interaction.reply({
        content: 'You must be in a Voice channel to use this command.',
        ephemeral: true,
      });
    }
    if (command.sameVc && player && botChannel !== memberChannel) {
      return interaction.reply({
        content: 'You must be in the same Voice channel as mine to use this command.',
        ephemeral: true,
      });
    }
    if (command.player && !player) {
      return interaction.reply({ content: 'No player exists for this server.', ephemeral: true });
    }
    if (command.current && !player?.currentTrack) {
      return interaction.reply({ content: 'There is nothing playing right now.', ephemeral: true });
    }

    await command.run(client, interaction);
  } catch (error) {
    console.error('CMD error:', error.message);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'An error occurred: ' + error.message, ephemeral: true });
    } else {
      await interaction.reply({ content: 'An error occurred: ' + error.message, ephemeral: true });
    }
  }
};
