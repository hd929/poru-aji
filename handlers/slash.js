const { readdirSync } = require('node:fs');
const path = require('node:path');
const Ascii = require('ascii-table');
const table = new Ascii('Slash commands');

module.exports = (client) => {
  const data = [];

  readdirSync('./slashCommands/').forEach((dir) => {
    const commands = readdirSync(`./slashCommands/${dir}/`).filter((file) =>
      file.endsWith('.js'),
    );

    for (const file of commands) {
      const pull = require(path.join(
        __dirname,
        `../slashCommands/${dir}/${file}`,
      ));

      if (pull.name) {
        client.slashCommands.set(pull.name, pull);
        data.push(pull);
        table.addRow(file, '✅');
      } else {
        table.addRow(
          file,
          `❌  -> missing a help.name, or help.name is not a string.`,
        );
        continue;
      }
    }
  });

  console.log(table.toString());

  client.on('ready', async () => {
    const guildId = client.guilds.cache.first()?.id;
    if (guildId) {
      const guild = client.guilds.cache.get(guildId);
      await guild.commands.set(data);
      console.log('Registered slash commands in guild:', guildId);
    } else {
      await client.application.commands.set(data);
      console.log('Registered global slash commands.');
    }
  });
};
