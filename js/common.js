/* common.js — runs on every page: boots the player + player bar, highlights
   the active nav item, renders the sidebar's playlist list, and wires the
   create-playlist and settings (API key) modals. */
function highlightActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .tab-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === page);
  });
}

function renderSidebarPlaylists() {
  const container = document.getElementById('sidebar-playlists');
  if (!container) return;
  container.innerHTML = '';
  Storage.getPlaylists().forEach(pl => {
    container.appendChild(UI.el('a', {
      class: 'sidebar-playlist-link', text: pl.name,
      attrs: { href: `playlist.html?id=${pl.id}` }
    }));
  });
}

function openCreatePlaylistModal() {
  const wrap = UI.el('div', {});
  wrap.appendChild(UI.el('h3', { text: 'New playlist' }));
  const input = UI.el('input', { attrs: { type: 'text', placeholder: 'Playlist name' } });
  const createBtn = UI.el('button', { class: 'btn-primary', text: 'Create' });
  createBtn.addEventListener('click', () => {
    const name = input.value.trim() || 'My Playlist';
    const pl = Storage.createPlaylist(name);
    UI.closeModal();
    window.location.href = `playlist.html?id=${pl.id}`;
  });
  wrap.append(input, createBtn);
  UI.openModal(wrap);
  setTimeout(() => input.focus(), 50);
}
window.openCreatePlaylistModal = openCreatePlaylistModal;

function openSettingsModal() {
  const wrap = UI.el('div', {});
  wrap.appendChild(UI.el('h3', { text: 'Settings' }));
  wrap.appendChild(UI.el('label', { class: 'field-label', text: 'YouTube Data API key' }));
  const input = UI.el('input', { attrs: { type: 'text', placeholder: 'Paste your API key here' } });
  input.value = Storage.getSettings().apiKey || '';
  wrap.appendChild(input);
  wrap.appendChild(UI.el('p', { class: 'field-help', text: 'Free from Google Cloud Console — used only for search, never for playback. Steps are in the README.' }));
  const saveBtn = UI.el('button', { class: 'btn-primary', text: 'Save' });
  saveBtn.addEventListener('click', () => {
    Storage.updateSettings({ apiKey: input.value.trim() });
    UI.toast('Saved');
    UI.closeModal();
  });
  wrap.appendChild(saveBtn);
  UI.openModal(wrap);
}
window.openSettingsModal = openSettingsModal;

function wireSidebarAndTopbar() {
  const createBtn = document.getElementById('create-playlist-btn');
  if (createBtn) createBtn.addEventListener('click', openCreatePlaylistModal);
  const gear = document.getElementById('settings-gear');
  if (gear) gear.addEventListener('click', openSettingsModal);
}

document.addEventListener('DOMContentLoaded', () => {
  PlayerBar.render();
  Player.init('yt-player-mount');
  highlightActiveNav();
  renderSidebarPlaylists();
  wireSidebarAndTopbar();
});
