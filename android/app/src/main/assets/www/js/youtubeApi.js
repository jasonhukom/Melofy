/* youtubeApi.js — thin wrapper around the official YouTube Data API v3
   search endpoint. Needs a free API key from Google Cloud Console, entered
   in Settings (see README). Only used for search; playback never needs it. */
const YouTubeAPI = (() => {
  const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
  const cache = new Map();

  function getKey() { return Storage.getSettings().apiKey || ''; }

  function decodeHtml(str) {
    const t = document.createElement('textarea');
    t.innerHTML = str;
    return t.value;
  }

  async function search(query) {
    const key = getKey();
    if (!key) throw new Error('NO_API_KEY');
    const cacheKey = query.trim().toLowerCase();
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    const params = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      maxResults: '20',
      videoCategoryId: '10', // Music category — narrows results to music content
      q: query,
      key
    });

    const res = await fetch(`${SEARCH_URL}?${params.toString()}`);
    if (!res.ok) {
      let message = 'SEARCH_FAILED';
      try { const body = await res.json(); message = body?.error?.message || message; } catch (e) {}
      throw new Error(message);
    }
    const data = await res.json();
    const songs = (data.items || [])
      .filter(item => item.id && item.id.videoId)
      .map(item => ({
        id: item.id.videoId,
        title: decodeHtml(item.snippet.title),
        artist: decodeHtml(item.snippet.channelTitle),
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || ''
      }));
    cache.set(cacheKey, songs);
    return songs;
  }

  return { search };
})();
