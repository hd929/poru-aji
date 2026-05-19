const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn('[MongoDB] MONGODB_URI not set. Database features will be disabled.');
}

let client;
let db;

async function connect() {
  if (client) return db;
  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db('dethi_db');
  console.log('[MongoDB] Connected successfully');
  return db;
}

async function getCollection(name) {
  if (!db) await connect();
  return db.collection(name);
}

// Settings
async function getServerSetting(guildId, key, defaultValue) {
  const col = await getCollection('settings');
  const doc = await col.findOne({ guildId, key });
  return doc ? doc.value : defaultValue;
}

async function setServerSetting(guildId, key, value) {
  const col = await getCollection('settings');
  await col.updateOne(
    { guildId, key },
    { $set: { value } },
    { upsert: true }
  );
}

// Top Tracks
async function incrementTrack(guildId, trackTitle, trackUri) {
  const col = await getCollection('topTracks');
  const key = `${trackTitle}|||${trackUri}`;
  await col.updateOne(
    { guildId, key },
    { $inc: { count: 1 }, $set: { lastPlayed: new Date() } },
    { upsert: true }
  );
}

async function getTopTracksForGuild(guildId, limit = 10) {
  const col = await getCollection('topTracks');
  return col.find({ guildId })
    .sort({ count: -1 })
    .limit(limit)
    .toArray();
}

async function getRecentTracks(guildId, limit = 10) {
  const col = await getCollection('topTracks');
  return col.find({ guildId })
    .sort({ lastPlayed: -1 })
    .limit(limit)
    .toArray();
}

// User profiles
async function updateUserProfile(guildId, userId, updates) {
  const col = await getCollection('userProfiles');
  await col.updateOne(
    { guildId, userId },
    { $set: { ...updates, updatedAt: new Date() } },
    { upsert: true }
  );
}

async function getUserProfile(guildId, userId) {
  const col = await getCollection('userProfiles');
  return col.findOne({ guildId, userId });
}

// Playlists
async function savePlaylist(guildId, name, userId, tracks) {
  const col = await getCollection('playlists');
  await col.updateOne(
    { guildId, name },
    { $set: { tracks, userId, updatedAt: new Date() } },
    { upsert: true }
  );
}

async function loadPlaylist(guildId, name) {
  const col = await getCollection('playlists');
  return col.findOne({ guildId, name });
}

async function deletePlaylist(guildId, name) {
  const col = await getCollection('playlists');
  const result = await col.deleteOne({ guildId, name });
  return result.deletedCount > 0;
}

async function listPlaylists(guildId) {
  const col = await getCollection('playlists');
  return col.find({ guildId }).toArray();
}

module.exports = {
  connect,
  getServerSetting,
  setServerSetting,
  incrementTrack,
  getTopTracksForGuild,
  getRecentTracks,
  updateUserProfile,
  getUserProfile,
  savePlaylist,
  loadPlaylist,
  deletePlaylist,
  listPlaylists,
};
