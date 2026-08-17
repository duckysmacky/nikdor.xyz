(() => {
  const grids = Array.from(document.querySelectorAll('.services-grid[data-category]'));
  if (grids.length === 0) return;

  const dataUrl = '/data/services.json';
  const gridByCategory = new Map(
    grids.map(grid => [grid.getAttribute('data-category'), grid])
  );

  const pad = (n) => String(n).padStart(2, '0');

  const setCount = (category, text) => {
    const label = document.querySelector(`[data-count="${category}"]`);
    if (label) label.textContent = text;
  };

  const renderService = (service, position) => {
    const card = document.createElement('article');
    card.className = 'service-card card--ink';

    const tags = Array.isArray(service.tags) ? service.tags : [];
    const detailsLabel = service.detailsLabel || 'Includes';
    const orderLink = service.orderLink || service.title;

    card.innerHTML = `
      <div class="card-head">
        <h3 class="service-title">${service.title}</h3>
        <span class="index-num">${pad(position)}</span>
      </div>
      <p class="service-desc">${service.description}</p>
      <p class="service-detail">
        <span>${detailsLabel}:</span> ${service.details}
      </p>
      <div class="service-tags tags">
        ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
      </div>
      <div class="card-foot">
        <div class="service-price">
          <span class="service-price-label">Price</span>
          <span class="service-price-value">${service.price}</span>
        </div>
        <button
          class="btn btn-invert order-trigger"
          type="button"
          data-service="${orderLink}"
        >
          order
        </button>
      </div>
    `;

    return card;
  };

  const loadServices = async () => {
    try {
      const response = await fetch(dataUrl, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`Failed to load services (${response.status})`);

      const services = await response.json();

      grids.forEach(grid => {
        grid.innerHTML = '';
      });

      const counts = new Map();

      services.forEach(service => {
        const category = service.category;
        const grid = gridByCategory.get(category);

        if (!grid) return;

        const position = (counts.get(category) || 0) + 1;
        counts.set(category, position);

        grid.appendChild(renderService(service, position));
      });

      gridByCategory.forEach((_, category) => {
        setCount(category, `${pad(counts.get(category) || 0)} items`);
      });
    } catch (error) {
      console.error(error);

      gridByCategory.forEach((grid, category) => {
        setCount(category, 'unavailable');

        grid.innerHTML = `
          <p class="services-empty">
            Services are unavailable right now. Please try again later.
          </p>
        `;
      });
    }
  };

  loadServices();
})();
