/* soundMixer.js — the floating "sound mixer": a button bottom-right that
   reveals a vertical volume slider when clicked (replaces having a volume
   slider inline in the player bar). */
const SoundMixer = (() => {
  let root, btn, panel, slider, valueLabel;
  let panelOpen = false;

  function render() {
    root = document.getElementById('sound-mixer');
    btn = document.getElementById('sound-mixer-btn');
    panel = document.getElementById('sound-mixer-panel');
    slider = document.getElementById('sound-mixer-slider');
    valueLabel = document.getElementById('sound-mixer-value');

    const startVolume = Storage.getSettings().volume ?? 80;
    slider.value = String(startVolume);
    valueLabel.textContent = String(startVolume);
    updateIcon(startVolume);

    btn.addEventListener('click', (e) => { e.stopPropagation(); setOpen(!panelOpen); });
    document.addEventListener('click', (e) => { if (panelOpen && !root.contains(e.target)) setOpen(false); });
    slider.addEventListener('input', (e) => {
      const v = Number(e.target.value);
      Player.setVolume(v);
      valueLabel.textContent = String(v);
      updateIcon(v);
    });
  }

  function updateIcon(v) { btn.innerHTML = v > 0 ? UI.icons.volumeHigh : UI.icons.volumeMute; }
  function setOpen(open) { panelOpen = open; root.classList.toggle('open', open); }

  return { render };
})();
