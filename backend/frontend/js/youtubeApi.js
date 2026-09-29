/* youtubeApi.js — calls THIS app's own backend, not Google directly. The
   backend holds the real YouTube API key server-side (see backend/.env.example)
   so nobody using the app needs their own key. */
const YouTubeAPI = (() => {
  const cache = new Map();

  async function search(query) {
    const cacheKey = query.trim().toLowerCase();
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'SEARCH_FAILED');

    cache.set(cacheKey, data.results);
    return data.results;
  }

  async function randomPicks() {
    const res = await fetch('/api/random');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'RANDOM_FAILED');
    return data.results;
  }

  return { search, randomPicks };
})();
