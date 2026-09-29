/* player.js — wraps the official YouTube IFrame Player API. This is the
   legitimate, documented way to embed YouTube playback in a page:
   https://developers.google.com/youtube/iframe_api_reference
   It does not (and cannot) strip YouTube's own ads — those are controlled
   by YouTube/content owners, not by the embedding page. */
const Player = (() => {
  let ytPlayer = null;
  let queue = [];
  let queueIndex = -1;
  let isReady = false;
  let listeners = [];

  function onEvent(cb) { listeners.push(cb); }
  function emit(type, data) { listeners.forEach(cb => { try { cb(type, data); } catch (e) {} }); }

  function loadYouTubeAPI() {
    return new Promise((resolve) => {
      if (window.YT && window.YT.Player) { resolve(); return; }
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (prevCallback) prevCallback(); resolve(); };
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
    });
  }

  async function init(containerId) {
    await loadYouTubeAPI();
    ytPlayer = new YT.Player(containerId, {
      height: '100%',
      width: '100%',
      playerVars: { autoplay: 0, controls: 0, disablekb: 1, modestbranding: 1, rel: 0, playsinline: 1 },
      events: { onReady: handleReady, onStateChange: handleStateChange, onError: handleError }
    });
  }

  function handleReady() {
    isReady = true;
    const settings = Storage.getSettings();
    ytPlayer.setVolume(settings.volume ?? 80);

    const saved = Storage.getPlayerState();
    if (saved && saved.videoId && saved.queue && saved.queue.length) {
      queue = saved.queue;
      queueIndex = saved.queueIndex ?? 0;
      ytPlayer.cueVideoById(saved.videoId, saved.positionSeconds || 0);
      emit('trackchange', currentSong());
      if (saved.isPlaying) {
        // Resuming playback after a page navigation. Browsers may block
        // autoplay here until the user interacts with the new page — if so
        // the bar will simply show a paused state, which is expected.
        setTimeout(() => {
          try { ytPlayer.seekTo(saved.positionSeconds || 0, true); ytPlayer.playVideo(); } catch (e) {}
        }, 300);
      }
    }
    setInterval(savePlayerState, 3000);
    window.addEventListener('beforeunload', savePlayerState);
    emit('ready');
  }

  function handleStateChange(e) {
    const S = window.YT.PlayerState;
    if (e.data === S.PLAYING) emit('play');
    if (e.data === S.PAUSED) emit('pause');
    if (e.data === S.ENDED) handleEnded();
    if (e.data === S.PLAYING || e.data === S.PAUSED) savePlayerState();
  }

  function handleError() {
    emit('error');
    setTimeout(() => next(), 1200); // skip a track that fails to load/play
  }

  function handleEnded() {
    const settings = Storage.getSettings();
    if (settings.repeat === 'one') { ytPlayer.seekTo(0, true); ytPlayer.playVideo(); return; }
    next();
  }

  function currentSong() { return queue[queueIndex] || null; }

  function playQueue(songs, startIndex = 0) {
    if (!songs || !songs.length) return;
    queue = songs.slice();
    queueIndex = startIndex;
    if (Storage.getSettings().shuffle) shuffleQueue(true);
    playCurrent();
  }

  function playCurrent() {
    const song = currentSong();
    if (!song || !ytPlayer || !isReady) return;
    ytPlayer.loadVideoById(song.id);
    Storage.addRecent(song);
    emit('trackchange', song);
    savePlayerState();
  }

  function playNow(song, contextList) {
    if (contextList && contextList.length) {
      const idx = contextList.findIndex(s => s.id === song.id);
      playQueue(contextList, idx >= 0 ? idx : 0);
    } else {
      playQueue([song], 0);
    }
  }

  function next() {
    if (!queue.length) return;
    const settings = Storage.getSettings();
    if (queueIndex < queue.length - 1) queueIndex++;
    else if (settings.repeat === 'all') queueIndex = 0;
    else { emit('pause'); return; }
    playCurrent();
  }

  function prev() {
    if (!queue.length || !ytPlayer) return;
    if (ytPlayer.getCurrentTime() > 3) { ytPlayer.seekTo(0, true); return; }
    if (queueIndex > 0) queueIndex--;
    playCurrent();
  }

  function togglePlay() {
    if (!ytPlayer) return;
    const state = ytPlayer.getPlayerState();
    if (state === YT.PlayerState.PLAYING) ytPlayer.pauseVideo();
    else ytPlayer.playVideo();
  }

  function seekTo(seconds) { ytPlayer && ytPlayer.seekTo(seconds, true); }

  function setVolume(v) { ytPlayer && ytPlayer.setVolume(v); Storage.updateSettings({ volume: v }); }

  function shuffleQueue(keepCurrentFirst) {
    const current = queue[queueIndex];
    const rest = queue.filter((_, i) => i !== queueIndex);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    queue = keepCurrentFirst && current ? [current, ...rest] : rest;
    queueIndex = 0;
  }

  function toggleShuffle() {
    const next = !Storage.getSettings().shuffle;
    Storage.updateSettings({ shuffle: next });
    if (next) shuffleQueue(true);
    emit('shufflechange', next);
    return next;
  }

  function cycleRepeat() {
    const order = ['off', 'all', 'one'];
    const mode = order[(order.indexOf(Storage.getSettings().repeat || 'off') + 1) % order.length];
    Storage.updateSettings({ repeat: mode });
    emit('repeatchange', mode);
    return mode;
  }

  function savePlayerState() {
    if (!ytPlayer || !isReady) return;
    try {
      Storage.setPlayerState({
        videoId: currentSong()?.id,
        positionSeconds: ytPlayer.getCurrentTime ? ytPlayer.getCurrentTime() : 0,
        isPlaying: ytPlayer.getPlayerState() === YT.PlayerState.PLAYING,
        queue, queueIndex, savedAt: Date.now()
      });
    } catch (e) {}
  }

  function getState() {
    return {
      isReady,
      queue, queueIndex,
      duration: (ytPlayer && ytPlayer.getDuration) ? ytPlayer.getDuration() : 0,
      position: (ytPlayer && ytPlayer.getCurrentTime) ? ytPlayer.getCurrentTime() : 0
    };
  }

  return {
    init, onEvent, playNow, playQueue, next, prev, togglePlay,
    seekTo, setVolume, toggleShuffle, cycleRepeat, currentSong, getState
  };
})();
