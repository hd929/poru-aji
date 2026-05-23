module.exports = {
  name: 'ping',
  description: 'Returns the ping of bot',
  run: async (client, interaction) => {
    interaction.reply({ content: `Pong! ${client.ws.ping}ms`, ephemeral: true });
  },
};
