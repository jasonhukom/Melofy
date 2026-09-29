const LikedView = {
  render(container) {
    const header = UI.el('div', { class: 'detail-header' });
    const art = UI.el('div', { class: 'detail-art liked-art' });
    art.innerHTML = UI.icons.heartFilled;
    const textWrap = UI.el('div', {});
    textWrap.append(
      UI.el('p', { class: 'detail-kicker', text: 'Playlist' }),
      UI.el('h1', { class: 'detail-title', text: 'Liked Songs' })
    );
    header.append(art, textWrap);

    const playBtn = UI.el('button', { class: 'btn-play-all' });
    playBtn.innerHTML = UI.icons.play + ' Play';
    const list = UI.el('div', { class: 'song-list' });
    container.append(header, playBtn, list);

    function draw() {
      list.innerHTML = '';
      const songs = Storage.getLiked();
      if (!songs.length) {
        list.appendChild(UI.el('p', { class: 'empty-state', text: 'Songs you like will show up here — tap the heart on any track.' }));
        return;
      }
      songs.forEach(song => list.appendChild(UI.songRow(song, { context: songs, onRemove: (s) => Storage.toggleLiked(s) })));
    }
    draw();

    playBtn.addEventListener('click', () => {
      const songs = Storage.getLiked();
      if (songs.length) Player.playQueue(songs, 0);
    });
  }
};
