/* sidebar.js — the slidable/closeable nav drawer. Same toggle mechanism at
   every screen size: open by default on wide screens, closed on narrow
   ones, always reachable via the menu button in the top bar. */
const Sidebar = (() => {
  let sidebarEl, backdropEl;
  const WIDE_BREAKPOINT = 960;

  function render() {
    sidebarEl = document.getElementById('sidebar');
    backdropEl = document.getElementById('sidebar-backdrop');
    document.getElementById('menu-btn').addEventListener('click', toggle);
    backdropEl.addEventListener('click', close);
    window.innerWidth > WIDE_BREAKPOINT ? open() : close();
  }

  function isOpen() { return sidebarEl.classList.contains('open'); }
  function toggle() { isOpen() ? close() : open(); }
  function open() { sidebarEl.classList.add('open'); backdropEl.classList.add('show'); }
  function close() { sidebarEl.classList.remove('open'); backdropEl.classList.remove('show'); }
  function closeOnNavigate() { if (window.innerWidth <= WIDE_BREAKPOINT) close(); }

  return { render, toggle, open, close, closeOnNavigate };
})();
window.Sidebar = Sidebar;
