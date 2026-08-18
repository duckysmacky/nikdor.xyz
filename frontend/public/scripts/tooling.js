// Renders #tooling-list from data/tooling.json — a config-driven spec sheet.
// Mirrors scripts/experience.js.
(() => {
  const list = document.getElementById('tooling-list');
  if (!list) return;

  const countLabel = document.getElementById('tooling-count');

  const pad = (n) => String(n).padStart(2, '0');

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const renderRow = (entry) => {
    const row = document.createElement('div');
    row.className = 'tooling-row';
    row.innerHTML = `
      <dt>${esc(entry.label)}</dt>
      <dd>${esc(entry.value)}</dd>
    `;
    return row;
  };

  const setCount = (n) => {
    if (countLabel) countLabel.textContent = `${pad(n)} ${n === 1 ? 'entry' : 'entries'}`;
  };

  fetch('/data/tooling.json', { cache: 'no-cache' })
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load tooling (${response.status})`);
      return response.json();
    })
    .then((data) => {
      const entries = Array.isArray(data) ? data : [];
      list.innerHTML = '';
      entries.forEach((entry) => list.appendChild(renderRow(entry)));
      setCount(entries.length);
    })
    .catch((error) => {
      console.error(error);
      list.innerHTML = '<p class="tooling-empty">Tooling info is unavailable right now.</p>';
      setCount(0);
    });
})();
