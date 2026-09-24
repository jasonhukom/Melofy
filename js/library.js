document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('library-grid');
  render();

  function render() {
    grid.innerHTML = '';
    grid.appendChild(buildCreateCard());

    const liked = Storage.getLiked();
    const likedCard = buildCard('Liked Songs', pluralSongs(liked.length), 'liked.html');
    likedCard.classList.add('liked-card');
    likedCard.querySelector('.library-card-icon').textContent = '♥';
    grid.appendChild(likedCard);

    Storage.getPlaylists().forEach(pl => {
      grid.appendChild(buildCard(pl.name, pluralSongs(pl.songs.length), `playlist.html?id=${pl.id}`));
    });
  }

  function pluralSongs(n) { return `${n} song${n === 1 ? '' : 's'}`; }

  function buildCard(title, subtitle, href) {
    const card = UI.el('a', { class: 'library-card', attrs: { href } });
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
});
