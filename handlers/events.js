const { readdirSync } = require('fs');
const Ascii = require('ascii-table');
const table = new Ascii('Events');
table.setHeading('Events', 'Load status');

module.exports = (client) => {
  const files = readdirSync(__dirname.replace('handlers', 'events')).filter(
    (file) => file.endsWith('.js'),
  );

  for (const file of files) {
    let eventName = file.replace('.js', '');
    try {
      const event = require(`${__dirname.replace(
        'handlers',
        'events',
      )}/${file}`);

      eventName = event.event || eventName;
      client.on(eventName, event.run.bind(null, client));
      table.addRow(eventName, '✅');
    } catch (err) {
      console.log(`Error while loading event: \n${err}`);
      console.log(err);
      table.addRow(eventName, `❌ -> Error while loading event`);
    }
  }

  console.log(table.toString());
};
