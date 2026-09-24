document.addEventListener('DOMContentLoaded', () => {
  render();

  function render() {
    const list = document.getElementById('liked-list');
    list.innerHTML = '';
    const songs = Storage.getLiked();
    if (!songs.length) {
      list.appendChild(UI.el('p', { class: 'empty-state', text: 'Songs you like will show up here — tap the heart on any track.' }));
      return;
    }
    songs.forEach(song => list.appendChild(UI.songRow(song, {
      context: songs,
      onRemove: (s) => Storage.toggleLiked(s)
    })));
  }

  document.getElementById('play-all-liked').addEventListener('click', () => {
    const songs = Storage.getLiked();
    if (songs.length) Player.playQueue(songs, 0);
  });
});
