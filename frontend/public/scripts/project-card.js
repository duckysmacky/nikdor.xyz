// Shared project segment registry, data fetch and card renderer —
// consumed by scripts/projects.js and scripts/home-projects.js.
window.NikdorProjects = (() => {
  const DATA_URL = '/data/projects.json';

  // "all" matches every project via its own predicate, all other segments
  // match on `category`. Featured projects get their own page section.
  const SEGMENTS = [
    {
      slug: 'all',
      label: 'all',
      description: 'Every project in one list',
      filter: () => true,
    },
    {
      slug: 'systems',
      label: 'systems',
      description: 'Low-level projects, built from scratch or close to the hardware',
    },
    {
      slug: 'services',
      label: 'services',
      description: 'Real running systems, platforms and bots',
    },
    {
      slug: 'tools',
      label: 'tools',
      description: 'Various utilities, CLIs and day to day tools',
    },
    {
      slug: 'apps',
      label: 'apps',
      description: 'User-facing GUI, like web, desktop or mobile applications',
    },
    {
      slug: 'ai',
      label: 'ai',
      description: 'Tooling built for agents to use',
    },
    {
      slug: 'gaming',
      label: 'gaming',
      description: 'Minecraft mods and plugins',
    },
    {
      slug: 'learning',
      label: 'learning',
      description: 'Built to learn a domain. The understanding is the goal, the code is the byproduct.',
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
    return Array.isArray(data) ? data.filter((project) => project.enabled !== false) : [];
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
  const renderCard = (project, position, mode = 'open', options = {}) => {
    const card = document.createElement('article');
    card.className = options.wide ? 'project project--wide card--ink' : 'project card--ink';
    card.dataset.projectId = project.id || '';

    const status = project.status ? `<span class="tag">${esc(project.status)}</span>` : '';
    const category = options.showCategory && project.category
      ? `<span class="tag">${esc(project.category)}</span>`
      : '';

    const title = mode === 'open'
      ? `<button class="project-open" type="button" data-project-open="${esc(project.id)}">${esc(project.title)}</button>`
      : `<a class="project-open" href="/projects.html#${esc(project.id)}" data-link>${esc(project.title)}</a>`;

    if (options.wide) {
      // wide variant: story on the left, labelled facts in a side column
      const fact = (label, value) => (value
        ? `<div class="project-fact"><dt>${label}</dt><dd>${value}</dd></div>`
        : '');
      card.innerHTML = `
        <div class="project-main">
          <div class="card-head">
            <h3 class="project-name">${title}</h3>
            <span class="index-num">${pad(position)}</span>
          </div>
          <p class="project-summary">${esc(project.summary || '')}</p>
          <div class="tags">${tagMarkup(project.tags)}</div>
        </div>
        <dl class="project-side">
          ${fact('status', status)}
          ${fact('category', project.category ? `<span class="tag">${esc(project.category)}</span>` : '')}
          ${fact('stack', `<div class="tags">${tagMarkup(project.languages, 'tag--lang')}</div>`)}
          ${fact('year', project.year ? `<span class="project-year">${esc(project.year)}</span>` : '')}
        </dl>
      `;
      return card;
    }

    card.innerHTML = `
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
