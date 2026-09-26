document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  const status = document.getElementById('search-status');

  const params = new URLSearchParams(location.search);
  const initialQuery = params.get('q');
  if (initialQuery) { input.value = initialQuery; runSearch(initialQuery); }

  const debouncedSearch = UI.debounce((q) => runSearch(q), 500);
  input.addEventListener('input', () => {
    const q = input.value.trim();
    if (q.length >= 2) debouncedSearch(q);
    if (!q) { results.innerHTML = ''; status.textContent = ''; }
  });
  input.focus();

  async function runSearch(query) {
    if (!Storage.getSettings().apiKey) {
      status.textContent = '';
      results.innerHTML = '';
      const msg = UI.el('div', { class: 'empty-state' });
      msg.appendChild(document.createTextNode('Add your free YouTube API key to search. '));
      const btn = UI.el('button', { class: 'link-btn', text: 'Open settings' });
      btn.addEventListener('click', () => window.openSettingsModal());
      msg.appendChild(btn);
      results.appendChild(msg);
      return;
    }
    status.textContent = 'Searching…';
    results.innerHTML = '';
    try {
      const songs = await YouTubeAPI.search(query);
      status.textContent = songs.length ? `${songs.length} results` : 'No results found';
      songs.forEach(song => results.appendChild(UI.songRow(song, { context: songs })));
    } catch (err) {
      status.textContent = '';
      const message = err.message === 'NO_API_KEY'
        ? 'Add your API key in Settings to search.'
        : 'Search failed — check your API key and daily quota in Settings.';
      results.appendChild(UI.el('p', { class: 'empty-state', text: message }));
    }
  }
});
