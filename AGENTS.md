# AGENTS.md

High-signal repository constraints and execution context to avoid common failure modes for future agent sessions.

---

## ⚡ Critical Constraints & Gotchas

* **Lavalink Blocked on YouTube**: The AWS server IP (`3.27.136.202`) is strictly blocked by YouTube ("Sign in to confirm you're not a bot"). **SoundCloud (`scsearch:`) is the primary playback source**, fallback order is `SoundCloud -> Bandcamp -> YouTube`.
* **TypeScript Build Dependency**: `poru-spotify` pulls a branch of `poru` that compiles from source on `npm install`. To build on the AWS server, `typescript@4.9.5` must be globally installed (`npm install -g typescript@4.9.5`) because newer TypeScript versions throw strict compilation errors on `poru`'s deprecated tsconfig values.
* **Low-Memory AWS Server Optimization**: 1GB RAM AWS instance. Both services run in PM2 with strict heap bounds:
  * **Bot**: `pm2 start index.js --name "poru-bot" --node-args="--max-old-space-size=120"`
  * **Lavalink**: `pm2 start "java -Xmx160m -Xms120m -XX:+UseG1GC -jar Lavalink.jar" --name "lavalink"`
* **Voice Shard Hooking**: Poru v5 requires manual voice packet updates hooked on the client ws shard. This hook **must** live under the `ready` (not `clientReady`) event listener in `index.js` alongside `db.connect()`.
* **Prefix Commands Obsolete**: All legacy prefix commands under `commands/`, `messageCreate.js`, and `handlers/commands.js` have been completely removed. The bot is strictly Slash Commands only.

---

## 🛠️ Developer Commands

* **Register Slash Commands**: Must run `node index.js --deploy` on the AWS instance whenever slash commands, descriptions, or options are modified.
* **AWS PM2 Management**:
  * Check status: `pm2 status`
  * Restart bot: `pm2 restart poru-bot`
  * Tailing logs: `pm2 logs --lines 50`

---

## 🧩 Architectural & Algorithmic Quirks

### 1. Robust Graceful Database Fallbacks (`utils/db.js`)
All MongoDB database helper functions are wrap-guarded. If `MONGODB_URI` is not present, they **silently fail safe** (return `defaultValue`, `[]`, or `null` instead of throwing exceptions), allowing full music playback functionality to degrade gracefully without database features.

### 2. Autocomplete Mechanics (`slashCommands/Music/`)
* **`play.js`**: If input is `< 2` characters, suggestions fall back to the top 10 most played tracks in the server. Otherwise, it returns up to 25 suggestions fetched via `scsearch:`.
* **`artist.js`**: Filters search results to suggest up to 25 unique artist names (`author` field).

### 3. Continuous AI Radio (`utils/radio.js` & `poruEvents/`)
* **Played History Memory**: `player._radioHistory` tracks the last 50 song titles played to actively filter out duplicates returned by genre queries.
* **Error Resilience (`trackError.js` & `queueEnd.js`)**: If a track errors or loading fails, the system automatically retries with alternative genres before destroying the player. It uses a cumulative error threshold `_radioErrors` which resets to `0` upon any successful track start.

### 4. Search Query Cleanups (`utils/loadTrack.js`)
Before executing searches on SoundCloud/Bandcamp, queries are scrubbed of standard fluff (e.g. `[Official Video]`, `(Lyrics)`, `| HD`, etc.) using a dedicated regex cleaner `cleanQuery` to dramatically maximize fallback search accuracy.
