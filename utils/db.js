const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn('[MongoDB] MONGODB_URI not set. Database features will be disabled.');
}

let client;
let db;

async function connect() {
  if (!MONGODB_URI) return null;
  if (client) return db;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db('dethi_db');
    console.log('[MongoDB] Connected successfully');
    return db;
  } catch (err) {
    console.error('[MongoDB] Connection failed:', err.message);
    return null;
  }
}

async function getCollection(name) {
  if (!MONGODB_URI) return null;
  if (!db) {
    const connected = await connect();
    if (!connected) return null;
  }
  return db.collection(name);
}

// Settings
async function getServerSetting(guildId, key, defaultValue) {
  try {
    const col = await getCollection('settings');
    if (!col) return defaultValue;
    const doc = await col.findOne({ guildId, key });
    return doc ? doc.value : defaultValue;
  } catch (err) {
    console.error('[MongoDB Settings] get error:', err.message);
    return defaultValue;
  }
}

async function setServerSetting(guildId, key, value) {
  try {
    const col = await getCollection('settings');
    if (!col) return;
    await col.updateOne(
      { guildId, key },
      { $set: { value } },
      { upsert: true }
    );
  } catch (err) {
    console.error('[MongoDB Settings] set error:', err.message);
  }
}

// Top Tracks
async function incrementTrack(guildId, trackTitle, trackUri) {
  try {
    const col = await getCollection('topTracks');
    if (!col) return;
    const key = `${trackTitle}|||${trackUri}`;
    await col.updateOne(
      { guildId, key },
      { $inc: { count: 1 }, $set: { lastPlayed: new Date() } },
      { upsert: true }
    );
  } catch (err) {
    console.error('[MongoDB TopTracks] increment error:', err.message);
  }
}

async function getTopTracksForGuild(guildId, limit = 10) {
  try {
    const col = await getCollection('topTracks');
    if (!col) return [];
    return await col.find({ guildId })
      .sort({ count: -1 })
      .limit(limit)
      .toArray();
  } catch (err) {
    console.error('[MongoDB TopTracks] get error:', err.message);
    return [];
  }
}

async function getRecentTracks(guildId, limit = 10) {
  try {
    const col = await getCollection('topTracks');
    if (!col) return [];
    return await col.find({ guildId })
      .sort({ lastPlayed: -1 })
      .limit(limit)
      .toArray();
  } catch (err) {
    console.error('[MongoDB TopTracks] get recent error:', err.message);
    return [];
  }
}

// User profiles
async function updateUserProfile(guildId, userId, updates) {
  try {
    const col = await getCollection('userProfiles');
    if (!col) return;
    await col.updateOne(
      { guildId, userId },
      { $set: { ...updates, updatedAt: new Date() } },
      { upsert: true }
    );
  } catch (err) {
    console.error('[MongoDB Profiles] update error:', err.message);
  }
}

async function getUserProfile(guildId, userId) {
  try {
    const col = await getCollection('userProfiles');
    if (!col) return null;
    return await col.findOne({ guildId, userId });
  } catch (err) {
    console.error('[MongoDB Profiles] get error:', err.message);
    return null;
  }
}

// Playlists
async function savePlaylist(guildId, name, userId, tracks) {
  try {
    const col = await getCollection('playlists');
    if (!col) return;
    await col.updateOne(
      { guildId, name },
      { $set: { tracks, userId, updatedAt: new Date() } },
      { upsert: true }
    );
  } catch (err) {
    console.error('[MongoDB Playlists] save error:', err.message);
  }
}

async function loadPlaylist(guildId, name) {
  try {
    const col = await getCollection('playlists');
    if (!col) return null;
    return await col.findOne({ guildId, name });
  } catch (err) {
    console.error('[MongoDB Playlists] load error:', err.message);
    return null;
  }
}

async function deletePlaylist(guildId, name) {
  try {
    const col = await getCollection('playlists');
    if (!col) return false;
    const result = await col.deleteOne({ guildId, name });
    return result.deletedCount > 0;
  } catch (err) {
    console.error('[MongoDB Playlists] delete error:', err.message);
    return false;
  }
}

async function listPlaylists(guildId) {
  try {
    const col = await getCollection('playlists');
    if (!col) return [];
    return await col.find({ guildId }).toArray();
  } catch (err) {
    console.error('[MongoDB Playlists] list error:', err.message);
    return [];
  }
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
