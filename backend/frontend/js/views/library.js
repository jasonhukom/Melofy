const LibraryView = {
  render(container) {
    container.appendChild(UI.el('h1', { class: 'page-heading', text: 'Your Library' }));

    const grid = UI.el('div', { class: 'library-grid' });
    container.appendChild(grid);
    renderLocalGrid(grid);

    const user = window.FirebaseAuth ? window.FirebaseAuth.getUser() : null;
    if (user && user.youtubeConnected) {
      renderYouTubeSections(container);
    } else if (user) {
      const prompt = UI.el('p', { class: 'empty-state' });
      prompt.appendChild(document.createTextNode('Connect your YouTube account to see your liked videos, subscriptions and playlists here. '));
      const btn = UI.el('button', { class: 'link-btn', text: 'Connect YouTube' });
      btn.addEventListener('click', () => window.FirebaseAuth.connectYouTube());
      prompt.appendChild(btn);
      container.appendChild(prompt);
    }
  }
};

function pluralSongs(n) { return `${n} song${n === 1 ? '' : 's'}`; }

function renderLocalGrid(grid) {
  grid.appendChild(buildCreateCard());

  const liked = Storage.getLiked();
  const likedCard = buildCard('Liked Songs', pluralSongs(liked.length), '/liked');
  likedCard.classList.add('liked-card');
  const likedIcon = likedCard.querySelector('.library-card-icon');
  likedIcon.innerHTML = UI.icons.heartFilled;
  grid.appendChild(likedCard);

  Storage.getPlaylists().forEach(pl => {
    grid.appendChild(buildCard(pl.name, pluralSongs(pl.songs.length), `/playlist?id=${pl.id}`));
  });
}

function buildCard(title, subtitle, route) {
  const card = UI.el('a', { class: 'library-card', attrs: { href: `#${route}` } });
  card.append(
    UI.el('div', { class: 'library-card-icon' }),
    UI.el('div', { class: 'library-card-title', text: title }),
    UI.el('div', { class: 'library-card-subtitle', text: subtitle })
  );
  return card;
}

function buildCreateCard() {
  const card = UI.el('button', { class: 'library-card-create' });
  card.append(
    UI.el('div', { class: 'library-card-icon create-icon', text: '+' }),
    UI.el('div', { class: 'library-card-title', text: 'New Playlist' }),
    UI.el('div', { class: 'library-card-subtitle', text: 'Create a playlist' })
  );
  card.addEventListener('click', () => window.openCreatePlaylistModal());
  return card;
}

function renderYouTubeSections(container) {
  const likedSection = UI.el('section', {});
  likedSection.appendChild(UI.el('h2', { class: 'section-heading', text: 'Liked on YouTube' }));
  const likedList = UI.el('div', { class: 'song-list' });
  likedList.appendChild(UI.el('p', { class: 'empty-state', text: 'Loading…' }));
  likedSection.appendChild(likedList);

  const subsSection = UI.el('section', {});
  subsSection.appendChild(UI.el('h2', { class: 'section-heading', text: 'Your subscriptions' }));
  const subsList = UI.el('div', {});
  subsList.appendChild(UI.el('p', { class: 'empty-state', text: 'Loading…' }));
  subsSection.appendChild(subsList);

  const playlistsSection = UI.el('section', {});
  playlistsSection.appendChild(UI.el('h2', { class: 'section-heading', text: 'Your YouTube playlists' }));
  const playlistsGrid = UI.el('div', { class: 'library-grid' });
  playlistsGrid.appendChild(UI.el('p', { class: 'empty-state', text: 'Loading…' }));
  playlistsSection.appendChild(playlistsGrid);

  container.append(likedSection, subsSection, playlistsSection);

  fetch('/api/youtube/liked', { credentials: 'same-origin' })
    .then(r => r.json())
    .then(data => {
      likedList.innerHTML = '';
      if (!data.results || !data.results.length) {
        likedList.appendChild(UI.el('p', { class: 'empty-state', text: 'No liked videos found on your YouTube account.' }));
        return;
      }
      data.results.forEach(song => likedList.appendChild(UI.songRow(song, { context: data.results })));
    })
    .catch(() => { likedList.innerHTML = ''; likedList.appendChild(UI.el('p', { class: 'empty-state', text: 'Could not load liked videos.' })); });

  fetch('/api/youtube/subscriptions', { credentials: 'same-origin' })
    .then(r => r.json())
    .then(data => {
      subsList.innerHTML = '';
      if (!data.results || !data.results.length) {
        subsList.appendChild(UI.el('p', { class: 'empty-state', text: 'No subscriptions found.' }));
        return;
      }
      data.results.forEach(ch => {
        const row = UI.el('div', { class: 'channel-row' });
        row.append(
          UI.el('img', { class: 'channel-thumb', attrs: { src: ch.thumbnail || '', alt: '', loading: 'lazy' } }),
          UI.el('div', { class: 'channel-title', text: ch.title })
        );
        subsList.appendChild(row);
      });
    })
    .catch(() => { subsList.innerHTML = ''; subsList.appendChild(UI.el('p', { class: 'empty-state', text: 'Could not load subscriptions.' })); });

  fetch('/api/youtube/playlists', { credentials: 'same-origin' })
    .then(r => r.json())
    .then(data => {
      playlistsGrid.innerHTML = '';
      if (!data.results || !data.results.length) {
        playlistsGrid.appendChild(UI.el('p', { class: 'empty-state', text: 'No YouTube playlists found.' }));
        return;
      }
      data.results.forEach(pl => {
        const card = UI.el('div', { class: 'library-card' });
        card.append(
          UI.el('img', { class: 'library-card-icon', attrs: { src: pl.thumbnail || '', alt: '', loading: 'lazy' } }),
          UI.el('div', { class: 'library-card-title', text: pl.title }),
          UI.el('div', { class: 'library-card-subtitle', text: `${pl.itemCount} video${pl.itemCount === 1 ? '' : 's'}` })
        );
        playlistsGrid.appendChild(card);
      });
    })
    .catch(() => { playlistsGrid.innerHTML = ''; playlistsGrid.appendChild(UI.el('p', { class: 'empty-state', text: 'Could not load playlists.' })); });
}
