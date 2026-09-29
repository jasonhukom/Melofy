const PlaylistView = {
  render(container, params) {
    const id = params.get('id');
    const playlist = Storage.getPlaylist(id);

    if (!playlist) {
      container.append(
        UI.el('h1', { class: 'page-heading', text: 'Playlist not found' }),
        UI.el('p', { class: 'empty-state', text: 'This playlist may have been deleted, or the link is invalid.' })
      );
      return;
    }

    const header = UI.el('div', { class: 'detail-header' });
    const art = UI.el('div', { class: 'detail-art' });
    const textWrap = UI.el('div', {});
    textWrap.append(
      UI.el('p', { class: 'detail-kicker', text: 'Playlist' }),
      UI.el('h1', { class: 'detail-title', text: playlist.name })
    );
    header.append(art, textWrap);

    const actions = UI.el('div', { class: 'detail-actions' });
    const playBtn = UI.el('button', { class: 'btn-play-all' });
    playBtn.innerHTML = UI.icons.play + ' Play';
    const deleteBtn = UI.el('button', { class: 'btn-secondary', text: 'Delete' });
    actions.append(playBtn, deleteBtn);

    const list = UI.el('div', { class: 'song-list' });
    container.append(header, actions, list);

    function draw() {
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
    draw();

    playBtn.addEventListener('click', () => { if (playlist.songs.length) Player.playQueue(playlist.songs, 0); });
    deleteBtn.addEventListener('click', () => {
      if (confirm(`Delete "${playlist.name}"? This can't be undone.`)) {
        Storage.deletePlaylist(playlist.id);
        Router.navigate('/library');
      }
    });
  }
};
