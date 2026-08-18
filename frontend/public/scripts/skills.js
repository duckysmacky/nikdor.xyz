// Renders #skills-list from data/skills.json — categories render in JSON
// array order. Mirrors scripts/experience.js.
(() => {
  const list = document.getElementById('skills-list');
  if (!list) return;

  const scroller = document.querySelector('.skills-scroll');

  // Native cross-axis wheel-to-horizontal-scroll translation is inconsistent
  // across engines for a container with `overflow-x: auto` — don't rely on
  // it. Redirect vertical wheel delta to scrollLeft ourselves whenever the
  // gesture reads as vertical (a real horizontal/trackpad swipe still passes
  // through untouched).
  if (scroller) {
    scroller.addEventListener('wheel', (event) => {
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault();
        scroller.scrollLeft += event.deltaY;
      }
    }, { passive: false });
  }

  const countLabel = document.getElementById('skills-count');

  const pad = (n) => String(n).padStart(2, '0');

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const renderCategory = (category) => {
    const skills = Array.isArray(category.skills) ? category.skills : [];

    const items = skills.map((skill) => `
      <div class="skill-item">
        <div class="skill-name">${esc(skill.name)}</div>
        <div class="skill-desc">${esc(skill.description || '')}</div>
      </div>
    `).join('');

    const li = document.createElement('li');
    li.className = 'skill-entry';
    li.innerHTML = `
      <article class="skill-card card--ink">
        <div class="card-head">
          <h3>${esc(category.title)}</h3>
          <span class="index-num">${pad(skills.length)} ${skills.length === 1 ? 'item' : 'items'}</span>
        </div>
        ${items}
      </article>
    `;
    return li;
  };

  const setCount = (n) => {
    if (countLabel) countLabel.textContent = `${pad(n)} ${n === 1 ? 'category' : 'categories'}`;
  };

  fetch('/data/skills.json', { cache: 'no-cache' })
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load skills (${response.status})`);
      return response.json();
    })
    .then((data) => {
      const categories = Array.isArray(data) ? data : [];
      list.innerHTML = '';
      categories.forEach((category) => list.appendChild(renderCategory(category)));
      setCount(categories.length);
    })
    .catch((error) => {
      console.error(error);
      list.innerHTML = '<li class="skill-entry"><p class="skills-empty bar">Skills are unavailable right now.</p></li>';
      setCount(0);
    });
})();
