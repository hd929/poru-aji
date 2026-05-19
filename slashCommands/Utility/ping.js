module.exports = {
  name: 'ping',
  description: 'Returns the ping of bot',
  run: async (client, interaction) => {
    interaction.reply(`Pong! ${client.ws.ping}ms`);
  },
};
