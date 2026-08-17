// Renders #experience-list from data/experience.json — entries render in
// JSON array order (author newest first), mirroring scripts/projects.js.
(() => {
  const list = document.getElementById('experience-list');
  if (!list) return;

  const countLabel = document.getElementById('experience-count');

  const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const formatDate = (value) => {
    const [year, month] = String(value).split('-');
    const label = MONTHS[Number(month) - 1];
    return label ? `${label} ${year}` : year;
  };

  const tagMarkup = (values, extraClass = '') => (Array.isArray(values) ? values : [])
    .filter(Boolean)
    .map((value) => `<span class="tag${extraClass ? ` ${extraClass}` : ''}">${esc(value)}</span>`)
    .join('');

  const renderEntry = (entry) => {
    const li = document.createElement('li');
    li.className = 'exp-entry';

    const fromTime = entry.dateFrom
      ? `<time datetime="${esc(entry.dateFrom)}">${esc(formatDate(entry.dateFrom))}</time>`
      : '';
    const toTime = entry.dateTo
      ? `<time datetime="${esc(entry.dateTo)}">${esc(formatDate(entry.dateTo))}</time>`
      : 'present';

    const highlights = Array.isArray(entry.highlights) ? entry.highlights : [];
    const highlightsMarkup = highlights.length
      ? `<ul class="exp-points" role="list">${highlights.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`
      : '';

    li.innerHTML = `
      <article class="exp-card card--ink">
        <div class="card-head">
          <h3 class="exp-role">${esc(entry.role)} <span class="exp-kind">${esc(entry.kind)}</span></h3>
          <span class="exp-dates">${fromTime} / ${toTime}</span>
        </div>

        <p class="exp-org">
          <span class="exp-company">${esc(entry.company)}</span>
          <span class="exp-place">${esc(entry.place)}</span>
        </p>

        <p class="exp-summary">${esc(entry.summary)}</p>

        ${highlightsMarkup}

        <div class="card-foot">
          <div class="tags">
            ${tagMarkup(entry.languages, 'tag--lang')}
            ${tagMarkup(entry.tags)}
          </div>
        </div>
      </article>
    `;

    return li;
  };

  const setCount = (n) => {
    if (countLabel) countLabel.textContent = `${String(n).padStart(2, '0')} ${n === 1 ? 'entry' : 'entries'}`;
  };

  fetch('/data/experience.json', { cache: 'no-cache' })
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load experience (${response.status})`);
      return response.json();
    })
    .then((entries) => {
      const entryList = Array.isArray(entries) ? entries : [];
      list.innerHTML = '';
      entryList.forEach((entry) => list.appendChild(renderEntry(entry)));
      setCount(entryList.length);
    })
    .catch((error) => {
      console.error(error);
      list.innerHTML = '<li class="exp-entry"><p class="exp-empty">Experience is unavailable right now.</p></li>';
      setCount(0);
    });
})();
