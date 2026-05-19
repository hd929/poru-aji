const db = require('./db');

async function getServerSetting(guildId, key, defaultValue) {
  return db.getServerSetting(guildId, key, defaultValue);
}

async function setServerSetting(guildId, key, value) {
  return db.setServerSetting(guildId, key, value);
}

module.exports = { getServerSetting, setServerSetting };
