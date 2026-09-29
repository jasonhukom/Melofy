/* storage.js — all local persistence. No accounts, no server: everything lives
   in this browser's localStorage. Keys are namespaced with "melofy:". */
const Storage = (() => {
  const KEYS = {
    liked: 'melofy:liked',
    playlists: 'melofy:playlists',
    recent: 'melofy:recent',
    settings: 'melofy:settings',
    playerState: 'melofy:playerState'
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage full or blocked */ }
  }

  // Liked songs
  function getLiked() { return read(KEYS.liked, []); }
  function isLiked(id) { return getLiked().some(s => s.id === id); }
  function toggleLiked(song) {
    const liked = getLiked();
    const idx = liked.findIndex(s => s.id === song.id);
    if (idx >= 0) { liked.splice(idx, 1); write(KEYS.liked, liked); return false; }
    liked.unshift(song); write(KEYS.liked, liked); return true;
  }

  // Playlists
  function getPlaylists() { return read(KEYS.playlists, []); }
  function getPlaylist(id) { return getPlaylists().find(p => p.id === id) || null; }
  function createPlaylist(name) {
    const playlists = getPlaylists();
    const pl = { id: 'pl_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, createdAt: Date.now(), songs: [] };
    playlists.unshift(pl);
    write(KEYS.playlists, playlists);
    return pl;
  }
  function deletePlaylist(id) { write(KEYS.playlists, getPlaylists().filter(p => p.id !== id)); }
  function addToPlaylist(id, song) {
    const playlists = getPlaylists();
    const pl = playlists.find(p => p.id === id);
    if (!pl) return;
    if (!pl.songs.some(s => s.id === song.id)) pl.songs.push(song);
    write(KEYS.playlists, playlists);
  }
  function removeFromPlaylist(id, songId) {
    const playlists = getPlaylists();
    const pl = playlists.find(p => p.id === id);
    if (!pl) return;
    pl.songs = pl.songs.filter(s => s.id !== songId);
    write(KEYS.playlists, playlists);
  }

  // Recently played (most recent first, capped)
  function getRecent() { return read(KEYS.recent, []); }
  function addRecent(song) {
    let recent = getRecent().filter(s => s.id !== song.id);
    recent.unshift(song);
    write(KEYS.recent, recent.slice(0, 24));
  }

  // Settings: API key, volume, shuffle, repeat
  function getSettings() { return read(KEYS.settings, { apiKey: '', volume: 80, shuffle: false, repeat: 'off' }); }
  function updateSettings(patch) { write(KEYS.settings, { ...getSettings(), ...patch }); }

  // Player state — lets playback resume (same track + position) after a page navigation
  function getPlayerState() { return read(KEYS.playerState, null); }
  function setPlayerState(state) { write(KEYS.playerState, state); }

  return {
    getLiked, isLiked, toggleLiked,
    getPlaylists, getPlaylist, createPlaylist, deletePlaylist, addToPlaylist, removeFromPlaylist,
    getRecent, addRecent,
    getSettings, updateSettings,
    getPlayerState, setPlayerState
  };
})();
