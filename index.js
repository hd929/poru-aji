const { Client, Collection, GatewayIntentBits, REST, Routes } = require('discord.js');
require("dotenv").config();
const { Poru } = require('poru');
const db = require('./utils/db');
const { getServerSetting } = require('./utils/settings');
const path = require('path');
const fs = require('fs');

const client = new Client({
  failIfNotExists: true,
  allowedMentions: {
    parse: ['roles', 'users', 'everyone'],
    repliedUser: false,
  },
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.config = require('./config.json');

client.poru = new Poru(client, client.config.nodes, {
  library: "discord.js",
  defaultPlatform: "scsearch",
});

client.commands = new Collection();
client.aliases = new Collection();
client.slashCommands = new Collection();

['events', 'slash', 'poruEvent'].forEach((handler) => {
  require(`./handlers/${handler}`)(client);
});

client.poru.on('playerCreate', async (player) => {
  const savedVol = await getServerSetting(player.guildId, 'volume', 100);
  player.setVolume(savedVol);
  console.log(`[Player] Created for guild ${player.guildId}, volume: ${savedVol}%`);
});

client.poru.on('nodeConnect', (node) => {
  console.log(`[Lavalink] Node ${node.name} connected`);
});

client.poru.on('nodeError', (node, error) => {
  console.error(`[Lavalink] Node ${node.name} error:`, error.message);
});

client.poru.on('nodeDisconnect', (node, code, reason) => {
  console.log(`[Lavalink] Node ${node.name} disconnected: ${code} - ${reason || 'No reason'}`);
  if (code === 1006) {
    console.log('[Lavalink] Connection lost. Check if Lavalink server is running.');
  }
});

client.poru.on('nodeReconnecting', (node, reconnectsLeft) => {
  console.log(`[Lavalink] Node ${node.name} reconnecting. ${reconnectsLeft} attempts left.`);
});

client.poru.on('nodeDestroy', (node) => {
  console.log(`[Lavalink] Node ${node.name} destroyed.`);
});

client.on('clientReady', async () => {
  await db.connect();

  for (const shard of client.ws.shards.values()) {
    if (!shard._poruHooked) {
      shard._poruHooked = true;
      const original = shard.onPacket;
      shard.onPacket = function(packet) {
        if (packet?.t && ['VOICE_STATE_UPDATE', 'VOICE_SERVER_UPDATE'].includes(packet.t)) {
          client.poru.packetUpdate(packet);
        }
        return original.call(this, packet);
      };
      console.log('[Poru] Hooked shard', shard.id);
    }
  }

  console.log(`[Bot] Logged in as ${client.user.tag}`);
  console.log(`[Bot] Ready in ${client.guilds.cache.size} server(s)`);
});

process.on('SIGINT', async () => {
  console.log('[Bot] Shutting down gracefully...');
  for (const player of client.poru.players.values()) {
    player.destroy();
  }
  await client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[Bot] Shutting down gracefully...');
  for (const player of client.poru.players.values()) {
    player.destroy();
  }
  await client.destroy();
  process.exit(0);
});

async function deployCommands() {
  const config = require('./config.json');
  const commands = [];
  const slashCommandsPath = path.join(__dirname, 'slashCommands');

  if (fs.existsSync(slashCommandsPath)) {
    const dirs = fs.readdirSync(slashCommandsPath);
    for (const dir of dirs) {
      const dirPath = path.join(slashCommandsPath, dir);
      if (fs.statSync(dirPath).isDirectory()) {
        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.js'));
        for (const file of files) {
          const cmd = require(path.join(dirPath, file));
          if (cmd.name && cmd.description) {
            commands.push({
              name: cmd.name,
              description: cmd.description,
              options: cmd.options || [],
            });
            console.log(`[Deploy] Loaded: ${cmd.name}`);
          }
        }
      }
    }
  }

  if (!config.clientId) {
    console.error('[Deploy] clientId not found in config.json.');
    process.exit(1);
  }

  const rest = new REST({ version: '11' }).setToken(process.env.TOKEN);

  try {
    console.log(`[Deploy] Registering ${commands.length} commands globally...`);
    await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
    console.log('[Deploy] Successfully registered global commands.');
    process.exit(0);
  } catch (error) {
    console.error('[Deploy] Failed:', error.message);
    process.exit(1);
  }
}

if (process.argv.includes('--deploy')) {
  deployCommands();
} else {
  client.login(process.env.TOKEN);
}
