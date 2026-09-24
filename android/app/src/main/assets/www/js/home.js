document.addEventListener('DOMContentLoaded', () => {
  const recentRow = document.getElementById('recent-row');
  const recents = Storage.getRecent();
  if (recents.length) {
    recents.forEach(song => recentRow.appendChild(UI.songRow(song, { context: recents })));
  } else {
    recentRow.appendChild(UI.el('p', { class: 'empty-state', text: 'Nothing played yet — try one of the genres above, or search for a song.' }));
  }

  document.querySelectorAll('.genre-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      window.location.href = `search.html?q=${encodeURIComponent(chip.dataset.query)}`;
    });
  });
});
