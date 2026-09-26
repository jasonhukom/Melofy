const SearchView = {
  render(container, params) {
    const searchBarWrap = UI.el('div', { class: 'search-bar-wrap' });
    const icon = UI.el('span', { class: 'search-icon' });
    icon.innerHTML = UI.icons.search;
    const input = UI.el('input', {
      class: 'search-input',
      attrs: { type: 'text', placeholder: 'What do you want to listen to?', autocomplete: 'off' }
    });
    searchBarWrap.append(icon, input);

    const status = UI.el('p', { class: 'search-status' });
    const results = UI.el('div', { class: 'song-list' });
    container.append(searchBarWrap, status, results);

    const initialQuery = params.get('q') || '';
    if (initialQuery) { input.value = initialQuery; runSearch(initialQuery); }
    input.focus();

    const debouncedSearch = UI.debounce((q) => runSearch(q), 500);
    input.addEventListener('input', () => {
      const q = input.value.trim();
      if (q.length >= 2) debouncedSearch(q);
      if (!q) { results.innerHTML = ''; status.textContent = ''; }
    });

    async function runSearch(query) {
      status.textContent = 'Searching…';
      results.innerHTML = '';
      try {
        const songs = await YouTubeAPI.search(query);
        status.textContent = songs.length ? `${songs.length} results` : 'No results found';
        songs.forEach(song => results.appendChild(UI.songRow(song, { context: songs })));
      } catch (err) {
        status.textContent = '';
        results.appendChild(UI.el('p', { class: 'empty-state', text: 'Search failed — try again in a moment.' }));
      }
    }
  }
};
