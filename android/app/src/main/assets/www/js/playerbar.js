/* playerbar.js — builds the persistent now-playing bar (present on every
   page) and wires it to player.js. The small square on the left is the
   actual YouTube player, styled to sit like album art. */
const PlayerBar = (() => {
  let progressTimer = null;

  function render() {
    const root = document.getElementById('player-bar-root');
    root.innerHTML = '';
    const bar = UI.el('div', { class: 'player-bar' });

    // Left: art + title/artist + like
    const left = UI.el('div', { class: 'pb-left' });
    const artWrap = UI.el('div', { class: 'pb-art', attrs: { id: 'pb-art' } });
    const mount = UI.el('div', { attrs: { id: 'yt-player-mount' } });
    const eqBadge = UI.el('div', { class: 'pb-eq-badge' });
    eqBadge.innerHTML = '<span></span><span></span><span></span>';
    artWrap.append(mount, eqBadge);

    const info = UI.el('div', { class: 'pb-info' });
    info.append(
      UI.el('div', { class: 'pb-title', text: 'Not playing', attrs: { id: 'pb-title' } }),
      UI.el('div', { class: 'pb-artist', text: 'Search to start listening', attrs: { id: 'pb-artist' } })
    );
    const likeBtn = UI.el('button', { class: 'icon-btn pb-like', attrs: { id: 'pb-like', 'aria-label': 'Like' } });
    likeBtn.innerHTML = UI.icons.heart;
    left.append(artWrap, info, likeBtn);

    // Center: transport controls + progress
    const center = UI.el('div', { class: 'pb-center' });
    const controls = UI.el('div', { class: 'pb-controls' });
    const mk = (id, label, icon) => {
      const b = UI.el('button', { class: 'icon-btn', attrs: { id, 'aria-label': label } });
      b.innerHTML = icon; return b;
    };
    const shuffleBtn = mk('pb-shuffle', 'Shuffle', UI.icons.shuffle);
    const prevBtn = mk('pb-prev', 'Previous', UI.icons.prev);
    const playBtn = UI.el('button', { class: 'icon-btn pb-play', attrs: { id: 'pb-play', 'aria-label': 'Play' } });
    playBtn.innerHTML = UI.icons.play;
    const nextBtn = mk('pb-next', 'Next', UI.icons.next);
    const repeatBtn = mk('pb-repeat', 'Repeat', UI.icons.repeat);
    controls.append(shuffleBtn, prevBtn, playBtn, nextBtn, repeatBtn);

    const progressRow = UI.el('div', { class: 'pb-progress-row' });
    progressRow.append(
      UI.el('span', { class: 'pb-time', text: '0:00', attrs: { id: 'pb-current-time' } }),
      UI.el('input', { class: 'pb-progress', attrs: { id: 'pb-progress', type: 'range', min: '0', max: '100', value: '0' } }),
      UI.el('span', { class: 'pb-time', text: '0:00', attrs: { id: 'pb-duration' } })
    );
    center.append(controls, progressRow);

    // Right: volume
    const right = UI.el('div', { class: 'pb-right' });
    const volIcon = UI.el('span', { class: 'pb-vol-icon' });
    volIcon.innerHTML = UI.icons.volume;
    const volume = UI.el('input', { class: 'pb-volume', attrs: { id: 'pb-volume', type: 'range', min: '0', max: '100', value: String(Storage.getSettings().volume ?? 80) } });
    right.append(volIcon, volume);

    bar.append(left, center, right);
    root.appendChild(bar);
    wireEvents();
  }

  function wireEvents() {
    document.getElementById('pb-play').addEventListener('click', () => Player.togglePlay());
    document.getElementById('pb-next').addEventListener('click', () => Player.next());
    document.getElementById('pb-prev').addEventListener('click', () => Player.prev());
    document.getElementById('pb-shuffle').addEventListener('click', (e) => {
      const on = Player.toggleShuffle();
      e.currentTarget.classList.toggle('active', on);
    });
    document.getElementById('pb-repeat').addEventListener('click', (e) => {
      const mode = Player.cycleRepeat();
      e.currentTarget.classList.toggle('active', mode !== 'off');
    });
    document.getElementById('pb-volume').addEventListener('input', (e) => Player.setVolume(Number(e.target.value)));
    document.getElementById('pb-progress').addEventListener('change', (e) => {
      const state = Player.getState();
      Player.seekTo((Number(e.target.value) / 100) * (state.duration || 0));
    });
    document.getElementById('pb-like').addEventListener('click', () => {
      const song = Player.currentSong();
      if (!song) return;
      const liked = Storage.toggleLiked(song);
      document.getElementById('pb-like').innerHTML = liked ? UI.icons.heartFilled : UI.icons.heart;
      document.getElementById('pb-like').classList.toggle('active', liked);
    });

    const settings = Storage.getSettings();
    document.getElementById('pb-shuffle').classList.toggle('active', !!settings.shuffle);
    document.getElementById('pb-repeat').classList.toggle('active', (settings.repeat || 'off') !== 'off');

    Player.onEvent((type, data) => {
      if (type === 'trackchange') updateTrackInfo(data);
      if (type === 'play') setPlayIcon(true);
      if (type === 'pause') setPlayIcon(false);
      if (type === 'ready') startProgressLoop();
    });
  }

  function updateTrackInfo(song) {
    if (!song) return;
    document.getElementById('pb-title').textContent = song.title;
    document.getElementById('pb-artist').textContent = song.artist;
    const liked = Storage.isLiked(song.id);
    const likeBtn = document.getElementById('pb-like');
    likeBtn.innerHTML = liked ? UI.icons.heartFilled : UI.icons.heart;
    likeBtn.classList.toggle('active', liked);
  }

  function setPlayIcon(isPlaying) {
    document.getElementById('pb-play').innerHTML = isPlaying ? UI.icons.pause : UI.icons.play;
    document.getElementById('pb-art')?.classList.toggle('is-playing', isPlaying);
  }

  function startProgressLoop() {
    if (progressTimer) clearInterval(progressTimer);
    progressTimer = setInterval(() => {
      const state = Player.getState();
      if (!state.duration) return;
      const pct = (state.position / state.duration) * 100;
      const progressEl = document.getElementById('pb-progress');
      if (progressEl && document.activeElement !== progressEl) progressEl.value = String(pct);
      document.getElementById('pb-current-time').textContent = UI.formatTime(state.position);
      document.getElementById('pb-duration').textContent = UI.formatTime(state.duration);
    }, 500);
  }

  return { render };
})();
