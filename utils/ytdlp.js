const { execSync } = require('child_process');

function isYoutubeLink(url) {
  return /(?:youtube\.com|youtu\.be)/i.test(url);
}

function isSoundCloudLink(url) {
  return /soundcloud\.com/i.test(url);
}

function getDirectUrl(url) {
  try {
    const result = execSync(
      `yt-dlp -f "bestaudio" --get-url --no-warnings --socket-timeout 15 "${url}"`,
      { encoding: 'utf8', timeout: 30000 }
    );
    const lines = result.trim().split('\n');
    const directUrl = lines[lines.length - 1].trim();
    return directUrl.startsWith('http') ? directUrl : null;
  } catch (e) {
    console.error('[yt-dlp] Error:', e.message);
    return null;
  }
}

function getVideoInfo(url) {
  try {
    const result = execSync(
      `yt-dlp --dump-json --no-warnings --socket-timeout 15 "${url}"`,
      { encoding: 'utf8', timeout: 30000 }
    );
    return JSON.parse(result);
  } catch (e) {
    console.error('[yt-dlp info] Error:', e.message);
    return null;
  }
}

module.exports = { isYoutubeLink, isSoundCloudLink, getDirectUrl, getVideoInfo };
