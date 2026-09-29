const HomeView = {
  render(container) {
    const heading = UI.el('h1', { class: 'page-heading', text: 'Good to see you' });

    const chipRow = UI.el('section', { class: 'chip-row' });
    [['Pop', 'pop hits'], ['Hip-Hop', 'hip hop'], ['Rock', 'rock'], ['Electronic', 'electronic dance'],
     ['Chill', 'chill lofi'], ['R&B', 'r&b soul'], ['Indie', 'indie'], ['K-Pop', 'k-pop'],
     ['Jazz', 'jazz'], ['Classical', 'classical piano']].forEach(([label, query]) => {
      const chip = UI.el('button', { class: 'genre-chip', text: label });
      chip.addEventListener('click', () => Router.navigate(`/search?q=${encodeURIComponent(query)}`));
      chipRow.appendChild(chip);
    });

    const discoverSection = UI.el('section', {});
    discoverSection.appendChild(UI.el('h2', { class: 'section-heading', text: 'Discover something new' }));
    const discoverRow = UI.el('div', { class: 'song-list' });
    discoverRow.appendChild(UI.el('p', { class: 'empty-state', text: 'Loading picks…' }));
    discoverSection.appendChild(discoverRow);

    const recentSection = UI.el('section', {});
    recentSection.appendChild(UI.el('h2', { class: 'section-heading', text: 'Recently played' }));
    const recentRow = UI.el('div', { class: 'song-list' });
    const recents = Storage.getRecent();
    if (recents.length) {
      recents.forEach(song => recentRow.appendChild(UI.songRow(song, { context: recents })));
    } else {
      recentRow.appendChild(UI.el('p', { class: 'empty-state', text: 'Nothing played yet — try a genre above, or search for a song.' }));
    }
    recentSection.appendChild(recentRow);

    container.append(heading, chipRow, discoverSection, recentSection);

    YouTubeAPI.randomPicks().then(songs => {
      discoverRow.innerHTML = '';
      if (!songs.length) { discoverRow.appendChild(UI.el('p', { class: 'empty-state', text: 'Nothing to show right now.' })); return; }
      songs.forEach(song => discoverRow.appendChild(UI.songRow(song, { context: songs })));
    }).catch(() => {
      discoverRow.innerHTML = '';
      discoverRow.appendChild(UI.el('p', { class: 'empty-state', text: 'Could not load picks right now.' }));
    });
  }
};
