// Counts are authored correctly in the HTML so they're right with JS off;
// this re-derives them so they can't go stale when an entry is added by hand.
(() => {
  document.querySelectorAll('[data-count-for]').forEach((el) => {
    const list = document.getElementById(el.dataset.countFor);
    if (!list) return;
    const n = list.querySelectorAll(':scope > li').length;
    el.textContent = `${String(n).padStart(2, '0')} ${n === 1 ? 'entry' : 'entries'}`;
  });
})();
