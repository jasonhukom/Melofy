/* ui.js — shared DOM helpers, icon set, and reusable components (song rows,
   modals, toasts). All remote data (titles, artist names from YouTube) is
   inserted with textContent, never innerHTML, to avoid injecting markup. */
const UI = (() => {
  function el(tag, opts = {}) {
    const node = document.createElement(tag);
    if (opts.class) node.className = opts.class;
    if (opts.text !== undefined) node.textContent = opts.text;
    if (opts.html !== undefined) node.innerHTML = opts.html; // only ever used with static icon strings below
    if (opts.attrs) Object.entries(opts.attrs).forEach(([k, v]) => node.setAttribute(k, v));
    if (opts.children) opts.children.forEach(c => node.appendChild(c));
    return node;
  }

  const icons = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5l10 7-10 7V5zm12 0h2v14h-2z"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 5l-10 7 10 7V5zM6 5H4v14h2z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-4.35-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.65-9.5 9-9.5 9z"/></svg>',
    heartFilled: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.35-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.65-9.5 9-9.5 9z"/></svg>',
    shuffle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h3l11 12h4M14 6h5v5M3 18h3l4-5"/></svg>',
    repeat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    volume: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 10v4h4l5 5V5L7 10H3z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>'
  };

  function formatTime(sec) {
    if (!sec || isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function debounce(fn, delay = 400) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
  }

  function toast(message) {
    const root = document.getElementById('toast-root');
    if (!root) return;
    const t = el('div', { class: 'toast', text: message });
    root.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 250); }, 2200);
  }

  function openModal(contentNode) {
    const root = document.getElementById('modal-root');
    root.innerHTML = '';
    const overlay = el('div', { class: 'modal-overlay' });
    const box = el('div', { class: 'modal-box' });
    box.appendChild(contentNode);
    overlay.appendChild(box);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    root.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
  }
  function closeModal() { document.getElementById('modal-root').innerHTML = ''; }

  function songRow(song, opts = {}) {
    const row = el('div', { class: 'song-row', attrs: { 'data-id': song.id } });
    const thumb = el('img', { class: 'song-thumb', attrs: { src: song.thumbnail || '', alt: '', loading: 'lazy' } });
    const info = el('div', { class: 'song-info' });
    info.append(
      el('div', { class: 'song-title', text: song.title }),
      el('div', { class: 'song-artist', text: song.artist })
    );

    const actions = el('div', { class: 'song-actions' });
    const likeBtn = el('button', { class: 'icon-btn like-btn', attrs: { 'aria-label': 'Like' } });
    const liked = Storage.isLiked(song.id);
    likeBtn.innerHTML = liked ? icons.heartFilled : icons.heart;
    likeBtn.classList.toggle('active', liked);
    likeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const nowLiked = Storage.toggleLiked(song);
      likeBtn.innerHTML = nowLiked ? icons.heartFilled : icons.heart;
      likeBtn.classList.toggle('active', nowLiked);
    });

    const addBtn = el('button', { class: 'icon-btn add-btn', attrs: { 'aria-label': 'Add to playlist' } });
    addBtn.innerHTML = icons.plus;
    addBtn.addEventListener('click', (e) => { e.stopPropagation(); openAddToPlaylist(song); });

    actions.append(likeBtn, addBtn);
    if (opts.onRemove) {
      const removeBtn = el('button', { class: 'icon-btn remove-btn', attrs: { 'aria-label': 'Remove' } });
      removeBtn.innerHTML = icons.trash;
      removeBtn.addEventListener('click', (e) => { e.stopPropagation(); opts.onRemove(song); row.remove(); });
      actions.append(removeBtn);
    }

    row.append(thumb, info, actions);
    row.addEventListener('click', () => Player.playNow(song, opts.context || null));
    return row;
  }

  function openAddToPlaylist(song) {
    const wrap = el('div', {});
    wrap.appendChild(el('h3', { text: 'Add to playlist' }));
    const list = el('div', { class: 'playlist-check-list' });
    const playlists = Storage.getPlaylists();
    if (!playlists.length) {
      list.appendChild(el('p', { class: 'empty-state', text: 'No playlists yet — create one below.' }));
    }
    playlists.forEach(pl => {
      const row = el('label', { class: 'playlist-check-row' });
      const checkbox = el('input', { attrs: { type: 'checkbox' } });
      checkbox.checked = pl.songs.some(s => s.id === song.id);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) Storage.addToPlaylist(pl.id, song);
        else Storage.removeFromPlaylist(pl.id, song.id);
      });
      row.append(checkbox, el('span', { text: pl.name }));
      list.appendChild(row);
    });
    wrap.appendChild(list);

    const newRow = el('div', { class: 'new-playlist-row' });
    const input = el('input', { attrs: { type: 'text', placeholder: 'New playlist name' } });
    const createBtn = el('button', { class: 'btn-primary', text: 'Create' });
    createBtn.addEventListener('click', () => {
      const name = input.value.trim();
      if (!name) return;
      const pl = Storage.createPlaylist(name);
      Storage.addToPlaylist(pl.id, song);
      toast(`Added to ${name}`);
      closeModal();
    });
    newRow.append(input, createBtn);
    wrap.appendChild(newRow);

    const doneBtn = el('button', { class: 'modal-done', text: 'Done' });
    doneBtn.addEventListener('click', closeModal);
    wrap.appendChild(doneBtn);

    openModal(wrap);
  }

  return { el, icons, formatTime, debounce, toast, openModal, closeModal, songRow, openAddToPlaylist };
})();
