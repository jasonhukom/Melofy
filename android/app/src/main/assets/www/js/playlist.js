document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const playlist = Storage.getPlaylist(id);
  const titleEl = document.getElementById('playlist-title');
  const list = document.getElementById('playlist-songs');
  const actions = document.getElementById('playlist-detail-actions');

  if (!playlist) {
    titleEl.textContent = 'Playlist not found';
    actions.style.display = 'none';
    list.appendChild(UI.el('p', { class: 'empty-state', text: 'This playlist may have been deleted, or the link is invalid.' }));
    return;
  }

  titleEl.textContent = playlist.name;
  render();

  function render() {
    list.innerHTML = '';
    if (!playlist.songs.length) {
      list.appendChild(UI.el('p', { class: 'empty-state', text: 'This playlist is empty — add songs from Search using the + button.' }));
      return;
    }
    playlist.songs.forEach(song => list.appendChild(UI.songRow(song, {
      context: playlist.songs,
      onRemove: (s) => Storage.removeFromPlaylist(playlist.id, s.id)
    })));
  }

  document.getElementById('play-all-playlist').addEventListener('click', () => {
    if (playlist.songs.length) Player.playQueue(playlist.songs, 0);
  });

  document.getElementById('delete-playlist').addEventListener('click', () => {
    if (confirm(`Delete "${playlist.name}"? This can't be undone.`)) {
      Storage.deletePlaylist(playlist.id);
      window.location.href = 'library.html';
    }
  });
});
