(() => {
  const grids = Array.from(document.querySelectorAll('.services-grid[data-category]'));
  if (grids.length === 0) return;

  const dataUrl = '/data/services.json';
  const gridByCategory = new Map(
    grids.map(grid => [grid.getAttribute('data-category'), grid])
  );

  const pad = (n) => String(n).padStart(2, '0');

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

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
        <h3 class="service-title">${esc(service.title)}</h3>
        <span class="index-num">${pad(position)}</span>
      </div>
      <p class="service-desc">${esc(service.description)}</p>
      <p class="service-detail">
        <span>${esc(detailsLabel)}:</span> ${esc(service.details)}
      </p>
      <div class="service-tags tags">
        ${tags.map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}
      </div>
      <div class="card-foot">
        <div class="service-payment">
          <span class="service-payment-label">payment</span>
          <span class="service-payment-value">${esc(service.payment)}</span>
        </div>
        <button
          class="btn btn-invert order-trigger"
          type="button"
          data-service="${esc(orderLink)}"
        >
          order
        </button>
      </div>
    `;

    return card;
  };

  // Category display names come from the page itself, so the section headings
  // stay the single source of truth for them.
  const categoryLabels = new Map(
    grids.map(grid => {
      const section = grid.closest('.services-section');
      const heading = section ? section.querySelector('h2') : null;
      return [
        grid.getAttribute('data-category'),
        heading ? heading.textContent.trim() : grid.getAttribute('data-category'),
      ];
    })
  );

  // The order form's service dropdown is filled from the same data as the
  // cards. The "Other" option is static markup so the custom-order button
  // works even before this resolves.
  const fillServiceSelect = (services) => {
    const select = document.getElementById('order-service');
    if (!select) return;

    const otherOption = select.querySelector('option[value="Other"]');

    Array.from(select.querySelectorAll('optgroup')).forEach(group => group.remove());

    categoryLabels.forEach((label, category) => {
      const matching = services.filter(service => service.category === category);
      if (matching.length === 0) return;

      const group = document.createElement('optgroup');
      group.label = label;

      matching.forEach(service => {
        const option = document.createElement('option');
        option.value = service.orderLink || service.title;
        option.textContent = service.title;
        group.appendChild(option);
      });

      select.insertBefore(group, otherOption);
    });
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

      fillServiceSelect(services);
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
