(() => {
  const api = window.NikdorProjects;
  const grid = document.getElementById('projects-list');
  const track = document.getElementById('cat-track');
  if (!api || !grid || !track) return;

  const segments = Array.from(track.querySelectorAll('.cat-seg'));
  const countLabel = document.getElementById('projects-count');
  const descBox = document.getElementById('cat-desc');
  const status = document.getElementById('projects-status');
  const modalRoot = document.getElementById('project-modal');
  const modalTitle = document.getElementById('project-modal-title');
  const modalBody = document.getElementById('project-modal-body');

  const buckets = new Map(); // slug -> project[]
  const byId = new Map(); // id -> project
  let active = null;

  const stripHash = () => {
    history.replaceState(null, '', location.pathname + location.search);
  };

  const modal = window.NikdorModal.create(modalRoot, { onClose: stripHash });

  const categoryLabel = (slug) => {
    const segment = api.SEGMENTS.find((s) => s.slug === slug && !s.filter);
    return segment ? segment.label : slug;
  };

  const buildModalBody = (project) => {
    const linkButtons = [
      { href: project.repositoryLink, label: 'repository' },
      { href: project.websiteLink, label: 'website' },
      { href: project.blogLink, label: 'blog' },
    ]
      .filter((entry) => entry.href)
      .map((entry) => `<a class="btn btn-invert" href="${api.esc(entry.href)}">${entry.label}</a>`)
      .join('');

    const highlights = Array.isArray(project.highlights) ? project.highlights : [];
    const highlightsMarkup = highlights.length
      ? `<ul class="project-modal-highlights">${highlights.map((item) => `<li>${api.esc(item)}</li>`).join('')}</ul>`
      : '';

    const metaRow = (label, value) => (value
      ? `<div><span class="eyebrow">// ${label}</span><span>${api.esc(value)}</span></div>`
      : '');

    return `
      <div class="tags project-modal-langs">${api.tagMarkup(project.languages, 'tag--lang')}</div>
      <p class="project-modal-text">${api.esc(project.description || '')}</p>
      ${highlightsMarkup}
      <div class="project-modal-meta">
        ${metaRow('status', project.status)}
        ${metaRow('year', project.year)}
        ${metaRow('category', categoryLabel(project.category))}
      </div>
      <div class="tags project-modal-tags">${api.tagMarkup(project.tags)}</div>
      <div class="card-foot">
        <div class="project-modal-links">${linkButtons}</div>
        <button class="btn btn-ghost" type="button" data-modal-close>close</button>
      </div>
    `;
  };

  const openProject = (id) => {
    const project = byId.get(id);
    if (!project) return;

    modalTitle.textContent = project.title;
    modalBody.innerHTML = buildModalBody(project);

    const url = new URL(location.href);
    url.hash = project.id;
    history.replaceState(null, '', url);

    modal.open();
  };

  const select = (slug, { focus = false, push = true } = {}) => {
    const index = api.SEGMENTS.findIndex((s) => s.slug === slug);
    if (index < 0) return;
    active = slug;

    track.style.setProperty('--cat-index', String(index));

    segments.forEach((seg, i) => {
      const on = i === index;
      seg.setAttribute('aria-selected', on ? 'true' : 'false');
      seg.tabIndex = on ? 0 : -1;
      if (on && focus) seg.focus();
    });
    if (focus) segments[index].scrollIntoView({ block: 'nearest', inline: 'nearest' });

    grid.setAttribute('aria-labelledby', segments[index].id);

    const meta = api.SEGMENTS[index];
    descBox.innerHTML = `<span class="eyebrow">// ${api.esc(meta.label)}</span>${api.esc(meta.description)}`;

    const list = buckets.get(slug) || [];
    grid.innerHTML = '';
    if (list.length === 0) {
      grid.innerHTML = '<p class="projects-empty">Nothing here yet. This category is reserved for work in progress.</p>';
    } else {
      list.forEach((project, i) => grid.appendChild(api.renderCard(project, i + 1, 'open', { showCategory: slug === 'featured' })));
    }

    countLabel.textContent = `${api.pad(list.length)} items`;
    if (status) status.textContent = `${meta.label}, ${list.length} projects`;

    if (push) {
      const url = new URL(location.href);
      url.searchParams.set('cat', slug);
      url.hash = '';
      history.replaceState(null, '', url);
    }
  };

  track.addEventListener('keydown', (event) => {
    const current = api.SEGMENTS.findIndex((s) => s.slug === active);
    const last = api.SEGMENTS.length - 1;
    let next = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = current === last ? 0 : current + 1;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = current === 0 ? last : current - 1;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = last;
    if (next === null) return;
    event.preventDefault();
    select(api.SEGMENTS[next].slug, { focus: true });
  });

  track.addEventListener('click', (event) => {
    const seg = event.target.closest('.cat-seg');
    if (seg) select(seg.dataset.category, { focus: true });
  });

  grid.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-project-open]');
    if (trigger) openProject(trigger.getAttribute('data-project-open'));
  });

  const setUnavailable = () => {
    countLabel.textContent = 'unavailable';
    if (status) status.textContent = 'projects are unavailable right now';
    grid.innerHTML = '<p class="projects-empty">Projects are unavailable right now. Please try again later.</p>';
    segments.forEach((seg) => {
      const numEl = seg.querySelector('.cat-num');
      if (numEl) numEl.textContent = '--';
    });
  };

  const load = async () => {
    try {
      const projects = await api.fetchProjects();

      api.SEGMENTS.forEach((segment) => {
        const list = projects.filter((project) => api.matchesSegment(segment, project));
        buckets.set(segment.slug, list);
      });

      projects.forEach((project) => {
        if (project.id) byId.set(project.id, project);
      });

      segments.forEach((seg) => {
        const slug = seg.dataset.category;
        const count = (buckets.get(slug) || []).length;
        const numEl = seg.querySelector('.cat-num');
        if (numEl) numEl.textContent = api.pad(count);
      });

      const params = new URLSearchParams(location.search);
      const requestedCat = params.get('cat');
      const hashId = location.hash ? location.hash.slice(1) : '';
      const hashProject = hashId ? byId.get(hashId) : null;

      let initial = 'featured';
      if (requestedCat && api.SEGMENTS.some((s) => s.slug === requestedCat)) {
        initial = requestedCat;
      } else if (hashProject) {
        initial = hashProject.featured ? 'featured' : hashProject.category;
      }

      select(initial, { push: false });

      requestAnimationFrame(() => track.classList.add('is-ready'));

      if (hashProject) openProject(hashProject.id);
    } catch (error) {
      console.error(error);
      setUnavailable();
    }
  };

  load();
})();
