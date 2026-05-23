// Fact Verification for GateGuard
// 1. File(s) and line(s) calling this:
//    - slashCommands/Music/mood.js:2
//    - slashCommands/Music/why.js:2
//    - slashCommands/Music/recommend.js:2
//    - slashCommands/Music/summarizequeue.js:2
//    - slashCommands/Music/roasttaste.js:2
//    - utils/autoplay.js:2
// 2. Confirm no existing file: Yes, we are overwriting the existing utils/ai.js to change its logic from remote AI API calls to local algorithms.
// 3. Data files structure: None. Contains static JavaScript constants (objects & arrays). No disk reads/writes.
// 4. User instruction verbatim: "Loại bỏ tính năng AI đi, thay vào đó hoàn toàn 100% dựa trên thuật toán để chạy, API key không rẻ như tôi tưởng"

/**
 * 100% Local Algorithm-based Music Recommendation & Utility Engine
 * No external AI API keys or network requests required. Faster, free, and robust.
 */

// Dataset of songs grouped by vibe/mood
const MUSIC_DATABASE = {
  chill: [
    { title: 'Weightless', artist: 'Marconi Union', reason: 'Ultra relaxing ambient soundscape' },
    { title: 'Resonance', artist: 'HOME', reason: 'Chill vaporwave synth vibe' },
    { title: 'Sunset Lover', artist: 'Petit Biscuit', reason: 'Warm acoustic-electronic crossover' },
    { title: 'We Find Each Other in the Dark', artist: 'Novo Amor', reason: 'Dreamy, ethereal indie-folk' },
    { title: 'Intro', artist: 'The xx', reason: 'Hypnotic, slow-burn guitar melody' },
    { title: 'Claire de Lune', artist: 'Claude Debussy', reason: 'Classical piano masterpiece for peace' },
    { title: 'Lullaby', artist: 'Low', reason: 'Slowcore track that slows down time' },
    { title: 'Day 1 森林', artist: 're:plus', reason: 'Soothing piano jazz hop' }
  ],
  sad: [
    { title: 'Someone Like You', artist: 'Adele', reason: 'Emotional powerhouse ballad' },
    { title: 'Fix You', artist: 'Coldplay', reason: 'Comforting, slow-building melancholy classic' },
    { title: 'Snuff', artist: 'Slipknot', reason: 'Heart-wrenching acoustic rock' },
    { title: 'Glimpse of Us', artist: 'Joji', reason: 'Haunting piano ballad about past love' },
    { title: 'All I Want', artist: 'Kodaline', reason: 'Indie track that perfectly captures longing' },
    { title: 'Skinny Love', artist: 'Bon Iver', reason: 'Raw, emotional acoustic folk' },
    { title: 'Let Her Go', artist: 'Passenger', reason: 'Nostalgic acoustic reflection' },
    { title: 'Liability', artist: 'Lorde', reason: 'Poignant, self-reflective piano pop' }
  ],
  gym: [
    { title: 'Till I Collapse', artist: 'Eminem', reason: 'Ultimate high-octane workout anthem' },
    { title: 'Remember the Name', artist: 'Fort Minor', reason: 'Iconic energetic hip-hop motivation' },
    { title: 'Bangarang', artist: 'Skrillex', reason: 'Aggressive dubstep to pump adrenaline' },
    { title: 'Power', artist: 'Kanye West', reason: 'Stomping beat with driving confidence' },
    { title: 'Eye of the Tiger', artist: 'Survivor', reason: 'The timeless classic training beat' },
    { title: 'Harder, Better, Faster, Stronger', artist: 'Daft Punk', reason: 'Repetitive house beat for tempo' },
    { title: 'Animals', artist: 'Martin Garrix', reason: 'Big room EDM drop with massive energy' },
    { title: 'Believer', artist: 'Imagine Dragons', reason: 'Pounding drums and passionate vocals' }
  ],
  hype: [
    { title: 'Sicko Mode', artist: 'Travis Scott', reason: 'Multi-part rap epic to shift the energy' },
    { title: 'HUMBLE.', artist: 'Kendrick Lamar', reason: 'Hard-hitting minimalist trap beat' },
    { title: 'Industry Baby', artist: 'Lil Nas X ft. Jack Harlow', reason: 'Brass-heavy epic hype anthem' },
    { title: 'Can\'t Stop', artist: 'Red Hot Chili Peppers', reason: 'Infectious funk-rock guitar riff' },
    { title: 'Levels', artist: 'Avicii', reason: 'Euphoric synth melody that lifts any crowd' },
    { title: 'First Class', artist: 'Jack Harlow', reason: 'Smooth but energetic modern hip-hop' },
    { title: 'Turn Down for What', artist: 'DJ Snake & Lil Jon', reason: 'Pure club chaos and bass drops' }
  ],
  lofi: [
    { title: 'Get You The Moon', artist: 'Kina ft. Snow', reason: 'Beautiful, emotional lofi bedroom pop' },
    { title: 'Snowman', artist: 'WYS', reason: 'Cozy, chill winter-themed instrumental' },
    { title: 'Affection', artist: 'Jinsang', reason: 'Smooth, nostalgic jazz-sampled lofi beat' },
    { title: 'Death Bed (Coffee for Your Head)', artist: 'Powfu', reason: 'Sweet acoustic guitar-driven lofi hip-hop' },
    { title: 'Keep You Safe', artist: 'Shiloh Dynasty', reason: 'Melancholic, raw vocal-led guitar loop' },
    { title: 'Morning', artist: 'Kalaido', reason: 'Bright, oriental instrument-fused beat' },
    { title: 'Eternal Youth', artist: 'Rude', reason: 'Atmospheric, slow-grooving oriental lofi' }
  ],
  happy: [
    { title: 'Happy', artist: 'Pharrell Williams', reason: 'Infectiously cheerful soul-pop anthem' },
    { title: 'Good Vibrations', artist: 'The Beach Boys', reason: 'Warm, uplifting multi-layered pop masterpiece' },
    { title: 'Can\'t Stop the Feeling!', artist: 'Justin Timberlake', reason: 'Upbeat disco-pop that gets you dancing' },
    { title: 'Don\'t Stop Me Now', artist: 'Queen', reason: 'High-speed rock celebration of good times' },
    { title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', reason: 'Super groovy funk-pop party starter' },
    { title: 'Dynamite', artist: 'BTS', reason: 'Disco-pop track full of energy and joy' }
  ],
  gaming: [
    { title: 'The Only Thing They Fear Is You', artist: 'Mick Gordon', reason: 'Brutal industrial metal from Doom Eternal' },
    { title: 'Megalo Box', artist: 'Mabanua', reason: 'Gritty hip-hop instrumental for focus' },
    { title: 'Intro', artist: 'C418', reason: 'Cozy nostalgia from Minecraft' },
    { title: 'Legends Never Die', artist: 'League of Legends', reason: 'Epic orchestral-pop gaming anthem' },
    { title: 'Cyberpunk 2077 Main Theme', artist: 'Marcin Przybyłowicz', reason: 'Grungy, futuristic electronic pulse' },
    { title: 'Splashing Around', artist: 'The Green Orbs', reason: 'Playful background music' }
  ],
  nightdrive: [
    { title: 'Nightcall', artist: 'Kavinsky', reason: 'Dark, cinematic French electro-synthwave' },
    { title: 'Midnight City', artist: 'M83', reason: 'Euphoric dream-pop with an iconic synth hook' },
    { title: 'After Hours', artist: 'The Weeknd', reason: 'Atmospheric dark R&B with a driving beat' },
    { title: 'Blinding Lights', artist: 'The Weeknd', reason: 'Upbeat 80s synth-pop masterpiece' },
    { title: 'Drive', artist: 'Glitch Mob', reason: 'Glitch-hop driving track' },
    { title: 'Teardrop', artist: 'Massive Attack', reason: 'Trip-hop classic with a hypnotic beat' }
  ]
};

// Flatten all tracks for fallback searches
const ALL_TRACKS = Object.keys(MUSIC_DATABASE).reduce((acc, key) => {
  return acc.concat(MUSIC_DATABASE[key]);
}, []);

// Funny local explanations list
const EXPLANATIONS = [
  "This song bridges the gap between your guilty pleasures and actual good music.",
  "Our local algorithm detected a 99.9% match between this track and your current level of coolness.",
  "Scientifically engineered to make you nod your head exactly 120 times per minute.",
  "Because the transition from the last track to this one is smoother than freshly paved asphalt.",
  "Your ears deserve this masterpiece right now. Trust the math, it is impeccable.",
  "Matches the exact atmospheric pressure of your room right now.",
  "Provides a smooth auditory buffer to keep the vibe exceptionally steady.",
  "Legend has it that playing this song increases your gaming/work efficiency by at least 42%.",
  "A sonic masterpiece hand-selected by our finely-tuned mathematical logic."
];

// Playful roasts list
const ROASTS = [
  "This queue looks like it was curated by a confused Spotify algorithm trying to please three different people at once.",
  "I've seen random number generators with a more cohesive sense of music style than this playlist.",
  "Are you playing music or just conducting a psychological experiment on how long your friends can endure transitions?",
  "This playlist is the musical equivalent of wearing socks with sandals: highly questionable, but you seem very confident about it.",
  "A mix of legendary tracks and songs that should have remained deep in the depths of 2012 internet.",
  "Did you search for 'songs to make my neighbors move out' to build this queue?",
  "This queue is like a buffet where the sushi is right next to the spaghetti. Bold, but why?",
  "Your taste ranges from 'soundtrack of an indie movie' to 'commercial background music' in the span of one track.",
  "I've computed your music taste. The results say you need to consult a musical therapist immediately."
];

// Vibe summaries list
const SUMMARIES = [
  "A beautifully chaotic journey that somehow makes absolute sense.",
  "An eclectic mix of tracks that suggests a listener with a wild imagination and great taste.",
  "A high-energy ride designed to keep the momentum going.",
  "A smooth, laid-back flow perfect for focusing or just winding down.",
  "A nostalgic trip down memory lane with a touch of modern energy.",
  "A cool, cinematic soundtrack vibe ideal for late-night thinking.",
  "An upbeat, positive sequence bound to put a smile on everyone's face."
];

// Helper to get random item from array
function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to shuffle array (Fisher-Yates)
function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Simulate askAI helper in case any old files expect it */
async function askAI(messages, model, temperature, retries) {
  return "Algorithm mode active. No AI called.";
}

/** Recommend songs based on current track details or queue */
async function recommendSongs(currentTrack, queue = [], count = 5) {
  // Simple similarity matching based on titles and author
  let matchedGenre = 'chill';
  const trackInfoStr = currentTrack
    ? `${currentTrack.info.title} ${currentTrack.info.author}`.toLowerCase()
    : '';

  // Scan keywords to guess best category
  if (trackInfoStr.includes('sad') || trackInfoStr.includes('cry') || trackInfoStr.includes('alone') || trackInfoStr.includes('broken')) {
    matchedGenre = 'sad';
  } else if (trackInfoStr.includes('gym') || trackInfoStr.includes('workout') || trackInfoStr.includes('fit') || trackInfoStr.includes('beast')) {
    matchedGenre = 'gym';
  } else if (trackInfoStr.includes('lofi') || trackInfoStr.includes('lo-fi') || trackInfoStr.includes('beat') || trackInfoStr.includes('relax')) {
    matchedGenre = 'lofi';
  } else if (trackInfoStr.includes('hype') || trackInfoStr.includes('rap') || trackInfoStr.includes('trap') || trackInfoStr.includes('bass')) {
    matchedGenre = 'hype';
  } else if (trackInfoStr.includes('happy') || trackInfoStr.includes('dance') || trackInfoStr.includes('party') || trackInfoStr.includes('smile')) {
    matchedGenre = 'happy';
  } else if (trackInfoStr.includes('game') || trackInfoStr.includes('doom') || trackInfoStr.includes('legends') || trackInfoStr.includes('cyberpunk')) {
    matchedGenre = 'gaming';
  } else if (trackInfoStr.includes('night') || trackInfoStr.includes('drive') || trackInfoStr.includes('car') || trackInfoStr.includes('dark')) {
    matchedGenre = 'nightdrive';
  } else {
    // If no keywords matched, pick a random category
    const genres = Object.keys(MUSIC_DATABASE);
    matchedGenre = getRandom(genres);
  }

  const genreTracks = MUSIC_DATABASE[matchedGenre] || MUSIC_DATABASE.chill;
  const queueTitles = queue.map(t => t.info.title.toLowerCase());

  // Filter out songs already in the queue
  let candidates = genreTracks.filter(t => !queueTitles.some(qt => qt.includes(t.title.toLowerCase())));

  // If not enough candidates, use all tracks from flattening
  if (candidates.length < count) {
    candidates = candidates.concat(
      ALL_TRACKS.filter(t => !queueTitles.some(qt => qt.includes(t.title.toLowerCase())))
    );
  }

  // Shuffle and slice
  const result = shuffle(candidates).slice(0, count);
  return result.map(t => ({
    title: t.title,
    artist: t.artist,
    reason: t.reason
  }));
}

/** Get a playlist for a specified mood vibe */
async function moodPlaylist(mood, count = 5) {
  const normMood = mood.toLowerCase().trim();
  let selectedGenre = 'chill';

  // Keyword mapping to genres
  if (normMood.includes('sad') || normMood.includes('depress') || normMood.includes('lonely') || normMood.includes('cry')) {
    selectedGenre = 'sad';
  } else if (normMood.includes('gym') || normMood.includes('workout') || normMood.includes('beast') || normMood.includes('lift') || normMood.includes('sport')) {
    selectedGenre = 'gym';
  } else if (normMood.includes('hype') || normMood.includes('rap') || normMood.includes('energetic') || normMood.includes('high')) {
    selectedGenre = 'hype';
  } else if (normMood.includes('lofi') || normMood.includes('lo-fi') || normMood.includes('study') || normMood.includes('sleep')) {
    selectedGenre = 'lofi';
  } else if (normMood.includes('happy') || normMood.includes('dance') || normMood.includes('joy') || normMood.includes('upbeat')) {
    selectedGenre = 'happy';
  } else if (normMood.includes('game') || normMood.includes('gaming') || normMood.includes('play')) {
    selectedGenre = 'gaming';
  } else if (normMood.includes('night') || normMood.includes('drive') || normMood.includes('midnight') || normMood.includes('retro')) {
    selectedGenre = 'nightdrive';
  } else {
    // If not matching specific keywords, try string similarity or choose closest key
    const genres = Object.keys(MUSIC_DATABASE);
    const matched = genres.find(g => normMood.includes(g));
    if (matched) selectedGenre = matched;
  }

  const tracks = MUSIC_DATABASE[selectedGenre] || MUSIC_DATABASE.chill;
  const result = shuffle(tracks).slice(0, count);

  return result.map(t => ({
    title: t.title,
    artist: t.artist,
    reason: t.reason
  }));
}

/** Explain why a song fits in 1 sentence */
async function explainSong(track, queue = []) {
  const rawExplanation = getRandom(EXPLANATIONS);
  return `"${track.info.title}" fits the vibe perfectly. ${rawExplanation}`;
}

/** Summarize queue vibe based on the list of tracks */
async function summarizeQueue(queue = []) {
  if (queue.length === 0) return "The queue is empty. Absolute silence.";

  // Seed-based selection from SUMMARIES using queue track count and lengths to make it deterministic but diverse
  const queueCharLength = queue.reduce((acc, t) => acc + t.info.title.length, 0);
  const index = (queue.length + queueCharLength) % SUMMARIES.length;

  return SUMMARIES[index];
}

/** Playfully roast the user's music taste based on the queue */
async function roastTaste(queue = []) {
  if (queue.length === 0) return "Your queue is empty. Hard to roast silence, but even your choice of nothingness is boring.";

  const queueCharLength = queue.reduce((acc, t) => acc + t.info.title.length, 0);
  const index = (queue.length * queueCharLength) % ROASTS.length;

  return ROASTS[index];
}

module.exports = {
  askAI,
  recommendSongs,
  moodPlaylist,
  explainSong,
  summarizeQueue,
  roastTaste,
};
