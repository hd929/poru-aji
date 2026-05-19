const OpenAI = require('openai');

const AI_API_KEY = process.env.AI_API_KEY;
const AI_API_URL = process.env.AI_API_URL || 'https://api.songyang.cyou/v1';

if (!AI_API_KEY) {
  console.warn('[AI] AI_API_KEY not set. AI features will be disabled.');
}

const ai = new OpenAI({
  apiKey: AI_API_KEY || 'dummy-key',
  baseURL: AI_API_URL,
});

const MODEL_SMART = 'Qwen3.5-Plus';
const MODEL_FAST = 'alibaba/qwen3.5-flash';

async function askAI(messages, model = MODEL_SMART, temperature = 0.9, retries = 2) {
  let lastError;
  for (let i = 0; i < retries + 1; i++) {
    try {
      const res = await ai.chat.completions.create({
        model,
        messages,
        temperature,
      });
      return res.choices[0].message.content;
    } catch (err) {
      lastError = err;
      console.error(`[AI] Attempt ${i + 1} failed:`, err.message);
      if (i < retries) await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
  throw lastError;
}

async function recommendSongs(currentTrack, queue = [], count = 5) {
  const current = currentTrack ? `${currentTrack.info.title} - ${currentTrack.info.author}` : '';
  const queueList = queue.slice(0, 5).map(t => t.info.title).join(', ');

  const raw = await askAI([
    {
      role: 'user',
      content: `Recommend ${count} songs similar to: "${current}"
Queue: ${queueList || 'empty'}
Avoid duplicates. Return JSON only:
[{"title":"...","artist":"...","reason":"..."}]`,
    },
  ], MODEL_FAST);

  try {
    const json = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(json);
  } catch {
    console.error('[AI] Failed to parse recommendation:', raw);
    return [];
  }
}

async function moodPlaylist(mood, count = 5) {
  const raw = await askAI([
    {
      role: 'user',
      content: `${count} songs for mood: "${mood}". JSON only:
[{"title":"...","artist":"...","reason":"..."}]`,
    },
  ], MODEL_SMART);

  try {
    const json = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(json);
  } catch {
    console.error('[AI] Failed to parse mood playlist:', raw);
    return [];
  }
}

async function explainSong(track, queue = []) {
  return await askAI([
    {
      role: 'user',
      content: `Why does "${track.info.title}" by ${track.info.author} fit this queue? 1 sentence, fun tone.`,
    },
  ], MODEL_FAST, 0.7);
}

async function summarizeQueue(queue = []) {
  const list = queue.slice(0, 10).map(t => t.info.title).join(', ');
  return await askAI([
    {
      role: 'user',
      content: `Describe this playlist vibe in 1 sentence: ${list || 'empty'}`,
    },
  ], MODEL_FAST, 0.8);
}

async function roastTaste(queue = []) {
  const list = queue.slice(0, 10).map(t => t.info.title).join(', ');
  return await askAI([
    {
      role: 'user',
      content: `Roast this music taste playfully, 1 sentence: ${list || 'empty'}`,
    },
  ], MODEL_SMART, 1.0);
}

module.exports = {
  askAI,
  recommendSongs,
  moodPlaylist,
  explainSong,
  summarizeQueue,
  roastTaste,
};
