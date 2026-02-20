(() => {
  const grids = Array.from(document.querySelectorAll('.services-grid[data-category]'));
  if (grids.length === 0) return;

  const dataUrl = '/data/services.json';
  const gridByCategory = new Map(
    grids.map(grid => [grid.getAttribute('data-category'), grid])
  );

  const renderService = (service) => {
    const card = document.createElement('article');
    card.className = 'service-card';

    const tags = Array.isArray(service.tags) ? service.tags : [];
    const detailsLabel = service.detailsLabel || 'Includes';
    const orderLink = service.orderLink || service.title;

    card.innerHTML = `
      <div class="service-card-header">
        <h3 class="service-title">${service.title}</h3>
      </div>
      <p class="service-desc">${service.description}</p>
      <p class="service-detail">
        <span>${detailsLabel}:</span> ${service.details}
      </p>
      <div class="service-tags badges">
        ${tags.map(tag => `<span class="badge">${tag}</span>`).join('')}
      </div>
      <div class="service-price">
        <span class="service-price-label">Price</span>
        <span class="service-price-value">${service.price}</span>
      </div>
      <div class="service-actions">
        <button
          class="btn btn-primary btn-order order-trigger"
          type="button"
          data-service="${orderLink}"
        >
          Order
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

      services.forEach(service => {
        const category = service.category;
        const grid = gridByCategory.get(category);

        if (!grid) return;

        grid.appendChild(renderService(service));
      });
    } catch (error) {
      console.error(error);

      grids.forEach(grid => {
        grid.innerHTML = `
          <p class="service-desc">
            Services are unavailable right now. Please try again later.
          </p>
        `;
      });
    }
  };

  loadServices();
})();
