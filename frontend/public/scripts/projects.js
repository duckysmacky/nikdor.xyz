(() => {
  const container = document.getElementById('projects-list');
  if (!container) return;

  const countLabel = document.getElementById('projects-count');
  const dataUrl = '/data/projects.json';

  const pad = (n) => String(n).padStart(3, '0');

  const renderProject = (project, position) => {
    const article = document.createElement('article');
    article.className = 'project card--ink';

    const languages = Array.isArray(project.languages) ? project.languages : [];
    const langMarkup = languages
      .filter(Boolean)
      .map(language => `<span class="tag">${language}</span>`)
      .join('');
    const tags = Array.isArray(project.tags) ? project.tags : [];
    const isPrivate = Boolean(project.private);
    const linkLabel = (project.linkLabel || (isPrivate ? 'private' : 'repository')).toLowerCase();
    const link = project.link || '#';
    const linkMarkup = isPrivate
      ? `<span class="link-disabled">${linkLabel}</span>`
      : `<a class="link-accent" href="${link}">${linkLabel}</a>`;
    const featured = project.pinned
      ? '<span class="kicker">featured</span>'
      : '';

    article.innerHTML = `
      ${featured}
      <div class="card-head">
        <h2 class="project-name">${project.title}</h2>
        <span class="index-num">${pad(position)}</span>
      </div>
      <div class="tags project-langs">${langMarkup}</div>
      <p class="project-text">${project.description}</p>
      <div class="card-foot">
        <div class="tags">
          ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        ${linkMarkup}
      </div>
    `;

    return article;
  };

  const setCount = (text) => {
    if (countLabel) countLabel.textContent = text;
  };

  const loadProjects = async () => {
    try {
      const response = await fetch(dataUrl, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`Failed to load projects (${response.status})`);

      const projects = await response.json();

      container.innerHTML = '';
      const sorted = projects
        .map((project, index) => ({ project, index }))
        .sort((a, b) => {
          const aPinned = Boolean(a.project.pinned);
          const bPinned = Boolean(b.project.pinned);

          if (aPinned === bPinned) return a.index - b.index;

          return aPinned ? -1 : 1;
        })
        .map(({ project }) => project);

      sorted.forEach((project, index) => {
        container.appendChild(renderProject(project, index + 1));
      });

      setCount(`${String(sorted.length).padStart(2, '0')} items`);
    } catch (error) {
      console.error(error);

      setCount('unavailable');

      container.innerHTML = `
        <p class="projects-empty">
          Projects are unavailable right now. Please try again later.
        </p>
      `;
    }
  };

  loadProjects();
})();
