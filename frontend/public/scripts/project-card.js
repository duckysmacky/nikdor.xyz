// Shared project segment registry, data fetch and card renderer —
// consumed by scripts/projects.js and scripts/home-projects.js.
window.NikdorProjects = (() => {
  const DATA_URL = '/data/projects.json';

  // "featured" is not a `category` value in the data — it cross-cuts every
  // category via its own predicate, all other segments match on category.
  const SEGMENTS = [
    {
      slug: 'product',
      label: 'products',
      description: 'Original tools built to be used, not just written. Each one solves a problem end to end.',
    },
    {
      slug: 'learning',
      label: 'learning',
      description: 'Built to learn a domain. The understanding is the goal, the code is the byproduct.',
    },
    {
      slug: 'featured',
      label: 'featured',
      description: 'Hand-picked best of the above. The work worth reading first.',
      filter: (project) => Boolean(project.featured),
    },
    {
      slug: 'experiment',
      label: 'experiments',
      description: 'Built because the idea was interesting. No roadmap, no users, still worth showing.',
    },
    {
      slug: 'ai',
      label: 'ai',
      description: 'Tooling built for models to use: agent skills, MCP servers, and the automation around them.',
    },
  ];

  const pad = (n) => String(n).padStart(2, '0');

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const fetchProjects = async () => {
    const response = await fetch(DATA_URL, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Failed to load projects (${response.status})`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  };

  const matchesSegment = (segment, project) => (
    typeof segment.filter === 'function'
      ? segment.filter(project)
      : project.category === segment.slug
  );

  const tagMarkup = (values, extraClass = '') => (Array.isArray(values) ? values : [])
    .filter(Boolean)
    .map((value) => `<span class="tag${extraClass ? ` ${extraClass}` : ''}">${esc(value)}</span>`)
    .join('');

  // mode: 'open' (projects page — opens the modal) | 'link' (home page — deep link)
  // the featured kicker only ever shows on the home page ('link' mode) — on
  // /projects.html a featured project's card looks like every other card
  const renderCard = (project, position, mode = 'open', options = {}) => {
    const card = document.createElement('article');
    card.className = 'project card--ink';
    card.dataset.projectId = project.id || '';

    const kicker = mode === 'link' && project.featured ? '<span class="kicker">featured</span>' : '';
    const status = project.status ? `<span class="tag">${esc(project.status)}</span>` : '';
    const category = options.showCategory && project.category
      ? `<span class="tag">${esc(project.category)}</span>`
      : '';

    const title = mode === 'open'
      ? `<button class="project-open" type="button" data-project-open="${esc(project.id)}">${esc(project.title)}</button>`
      : `<a class="project-open" href="/projects.html?cat=featured#${esc(project.id)}" data-link>${esc(project.title)}</a>`;

    card.innerHTML = `
      ${kicker}
      <div class="card-head">
        <h3 class="project-name">${title}</h3>
        <span class="index-num">${pad(position)}</span>
      </div>
      <p class="project-summary">${esc(project.summary || '')}</p>
      <div class="card-foot project-meta">
        <div class="tags">${status}${category}</div>
        <div class="tags">${tagMarkup(project.languages, 'tag--lang')}</div>
      </div>
    `;

    return card;
  };

  return { DATA_URL, SEGMENTS, pad, esc, fetchProjects, matchesSegment, tagMarkup, renderCard };
})();
