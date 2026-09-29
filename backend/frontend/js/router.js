/* router.js — a tiny hash-based router. This is what lets the app be a
   true single-page app: switching "pages" swaps content inside #main-content
   without a browser navigation, so the YouTube player never reloads and
   music keeps playing across the whole session (including in the
   background, if the tab/app loses focus — nothing here ever pauses it). */
const Router = (() => {
  const routes = {};
  let container = null;

  function register(path, renderFn) { routes[path] = renderFn; }

  function parseHash() {
    const raw = location.hash.slice(1) || '/';
    const [path, queryString] = raw.split('?');
    return { path: path || '/', params: new URLSearchParams(queryString || '') };
  }

  function navigate(path) {
    if (location.hash.slice(1) === path) { handle(); return; }
    location.hash = path;
  }

  function handle() {
    const { path, params } = parseHash();
    const renderFn = routes[path] || routes['/'];
    container.innerHTML = '';
    renderFn(container, params);
    highlightActiveNav(path.split('?')[0]);
    if (window.Sidebar) window.Sidebar.closeOnNavigate();
    container.scrollTop = 0;
  }

  function highlightActiveNav(path) {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-route') === path);
    });
  }

  function start(mountEl) {
    container = mountEl;
    window.addEventListener('hashchange', handle);
    handle();
  }

  return { register, navigate, start };
})();
