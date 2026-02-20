(() => {
  const container = document.getElementById('projects-list');
  if (!container) return;

  const dataUrl = '/data/projects.json';

  const renderProject = (project) => {
    const article = document.createElement('article');
    const classes = ['project'];

    if (project.pinned) classes.push('highlight');

    article.className = classes.join(' ');

    const titleTag = project.pinned ? 'h2' : 'h3';
    const languages = Array.isArray(project.languages) ? project.languages : [];
    const languagesText = languages.filter(Boolean).join(', ');
    const lang = languagesText ? `<span class="lang">${languagesText}</span>` : '';
    const tags = Array.isArray(project.tags) ? project.tags : [];
    const isPrivate = Boolean(project.private);
    const linkLabel = project.linkLabel || (isPrivate ? 'Private' : 'Repository');
    const link = project.link || '#';
    const linkMarkup = isPrivate
      ? `<span class="link link-disabled">${linkLabel}</span>`
      : `<a class="link-accent" href="${link}">> ${linkLabel}</a>`;

    article.innerHTML = `
      <div class="project-body">
        <${titleTag} class="project-name">${project.title} ${lang}</${titleTag}>
        <p class="project-text">${project.description}</p>
        <div class="project-meta">
          <div class="badges">
            ${tags.map(tag => `<span class="badge">${tag}</span>`).join('')}
          </div>
          ${linkMarkup}
        </div>
      </div>
    `;

    return article;
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

      sorted.forEach(project => {
        container.appendChild(renderProject(project));
      });
    } catch (error) {
      console.error(error);
      
      container.innerHTML = `
        <p class="project-text">
          Projects are unavailable right now. Please try again later.
        </p>
      `;
    }
  };

  loadProjects();
})();
