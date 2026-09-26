/* app.js — boots the whole app: player + player bar, sidebar drawer, sound
   mixer, the router and its routes, and the account section. This is the
   only file that runs on DOMContentLoaded; everything else is called from
   here so there's one clear startup order. */

function renderSidebarPlaylists() {
  const container = document.getElementById('sidebar-playlists');
  if (!container) return;
  container.innerHTML = '';
  Storage.getPlaylists().forEach(pl => {
    container.appendChild(UI.el('a', {
      class: 'sidebar-playlist-link', text: pl.name,
      attrs: { href: `#/playlist?id=${pl.id}` }
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
    renderSidebarPlaylists();
    Router.navigate(`/playlist?id=${pl.id}`);
  });
  wrap.append(input, createBtn);
  UI.openModal(wrap);
  setTimeout(() => input.focus(), 50);
}
window.openCreatePlaylistModal = openCreatePlaylistModal;

function renderAccountSection() {
  const container = document.getElementById('sidebar-account');
  if (!container || !window.FirebaseAuth) return;
  const user = window.FirebaseAuth.getUser();
  container.innerHTML = '';

  if (!user) {
    const signInBtn = UI.el('button', { class: 'btn-secondary', text: 'Sign in with Google' });
    signInBtn.style.width = '100%';
    signInBtn.addEventListener('click', () => window.FirebaseAuth.signIn());
    container.appendChild(signInBtn);
    return;
  }

  container.appendChild(UI.el('div', { class: 'sidebar-account-name', text: user.displayName || user.email || 'Signed in' }));

  if (user.youtubeConnected) {
    const badge = UI.el('div', { class: 'status-badge connected' });
    badge.append(UI.el('span', { class: 'dot' }), document.createTextNode('YouTube connected'));
    container.appendChild(badge);
  } else {
    const connectBtn = UI.el('button', { class: 'btn-secondary', text: 'Connect YouTube' });
    connectBtn.style.width = '100%';
    connectBtn.addEventListener('click', () => window.FirebaseAuth.connectYouTube());
    container.appendChild(connectBtn);
  }

  const signOutBtn = UI.el('button', { class: 'sidebar-account-sub', text: 'Sign out' });
  signOutBtn.style.textAlign = 'left';
  signOutBtn.addEventListener('click', () => window.FirebaseAuth.signOutEverywhere());
  container.appendChild(signOutBtn);
}

document.addEventListener('DOMContentLoaded', async () => {
  PlayerBar.render();
  Player.init('yt-player-mount');
  Sidebar.render();
  SoundMixer.render();
  renderSidebarPlaylists();

  Router.register('/', (c) => HomeView.render(c));
  Router.register('/search', (c, p) => SearchView.render(c, p));
  Router.register('/library', (c) => LibraryView.render(c));
  Router.register('/liked', (c) => LikedView.render(c));
  Router.register('/playlist', (c, p) => PlaylistView.render(c, p));
  Router.start(document.getElementById('main-content'));

  if (window.FirebaseAuth) {
    window.FirebaseAuth.onChange(() => {
      renderAccountSection();
      if (location.hash.startsWith('#/library')) Router.navigate('/library');
    });
    await window.FirebaseAuth.init();
    renderAccountSection();

    const hashQuery = new URLSearchParams((location.hash.split('?')[1]) || '');
    if (hashQuery.get('youtube') === 'connected') UI.toast('YouTube account connected');
    if (hashQuery.get('youtube') === 'error') UI.toast('Could not connect YouTube — try again');
  }
});
