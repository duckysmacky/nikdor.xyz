(() => {
  const api = window.NikdorProjects;
  const grid = document.getElementById('featured-list');
  if (!api || !grid) return;

  const countLabel = document.getElementById('featured-count');

  api.fetchProjects()
    .then((projects) => {
      const featured = projects.filter((project) => project.featured);
      grid.innerHTML = '';
      featured.forEach((project, i) => grid.appendChild(api.renderCard(project, i + 1, 'link')));
      if (countLabel) countLabel.textContent = `${api.pad(featured.length)} items`;
    })
    .catch((error) => {
      console.error(error);
      if (countLabel) countLabel.textContent = 'unavailable';
      grid.innerHTML = '<p class="projects-empty">Projects are unavailable right now.</p>';
    });
})();
