// Renders #certificates-list from data/certificates.json and #events-list
// from data/events.json — both render in JSON array order (authored newest
// first). One page controller, one NikdorModal instance (modal.js registers
// a window keydown listener per instance, so this page must own only one).
(() => {
  const certGrid = document.getElementById('certificates-list');
  const eventList = document.getElementById('events-list');
  if (!certGrid || !eventList) return;

  const certCount = document.getElementById('certificates-count');
  const eventCount = document.getElementById('events-count');
  const status = document.getElementById('portfolio-status');

  const modalRoot = document.getElementById('cert-modal');
  const modalTitle = document.getElementById('cert-modal-title');
  const modalBody = document.getElementById('cert-modal-body');

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const pad = (n) => String(n).padStart(2, '0');

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const tagMarkup = (values) => (Array.isArray(values) ? values : [])
    .filter(Boolean)
    .map((value) => `<span class="tag">${esc(value)}</span>`)
    .join('');

  // "2025-04" -> "Apr 2025"; "2024" -> "2024"
  const formatDate = (value) => {
    const [year, month] = String(value ?? '').split('-');
    const label = MONTHS[Number(month) - 1];
    return label ? `${label} ${year}` : year;
  };

  const yearOf = (value) => String(value ?? '').split('-')[0];

  const timeTag = (value, label) => (
    value ? `<time datetime="${esc(value)}">${esc(label)}</time>` : esc(label)
  );

  const setCount = (el, n) => {
    if (el) el.textContent = `${pad(n)} ${n === 1 ? 'item' : 'items'}`;
  };

  const byId = new Map();

  const stripHash = () => {
    history.replaceState(null, '', location.pathname + location.search);
  };

  const modal = window.NikdorModal.create(modalRoot, { onClose: stripHash });

  const renderCertCard = (cert, position) => {
    const card = document.createElement('article');
    card.className = 'cert-card card--ink';
    card.dataset.certId = cert.id || '';

    // date renders year-only; datetime keeps the authored precision
    const meta = [timeTag(cert.date, yearOf(cert.date)), esc(cert.source), esc(cert.type)]
      .filter(Boolean)
      .join(' / ');

    card.innerHTML = `
      <div class="card-head">
        <h3>${esc(cert.title)}</h3>
        <span class="index-num">${pad(position)}</span>
      </div>
      <div class="meta">${meta}</div>
      <p class="small">${esc(cert.description || '')}</p>
      <div class="card-foot">
        <button class="btn btn-invert" type="button" data-cert-open="${esc(cert.id)}">view</button>
      </div>
    `;
    return card;
  };

  const buildModalBody = (cert) => {
    // filenames carry spaces, parens and '+' — encodeURI escapes those but
    // leaves the path separators alone (encodeURIComponent would eat the '/')
    const src = encodeURI(cert.file || '');

    const openButton = cert.credentialLink
      ? `<a class="btn" href="${esc(cert.credentialLink)}" target="_blank" rel="noopener noreferrer">open</a>`
      : '';

    return `
      <iframe
        class="cert-frame"
        title="${esc(cert.title)} certificate full view"
        src="${esc(src)}"
        loading="lazy"
      ></iframe>
      <div class="cert-actions">
        <div class="cert-actions-links">
          <a class="btn btn-primary" href="${esc(src)}" download>download</a>
          ${openButton}
        </div>
        <button class="btn btn-ghost" type="button" data-modal-close>close</button>
      </div>
    `;
  };

  const openCert = (id) => {
    const cert = byId.get(id);
    if (!cert || !modal) return;

    modalTitle.textContent = cert.title;
    modalBody.innerHTML = buildModalBody(cert);

    const url = new URL(location.href);
    url.hash = cert.id;
    history.replaceState(null, '', url);

    modal.open();
  };

  certGrid.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-cert-open]');
    if (trigger) openCert(trigger.getAttribute('data-cert-open'));
  });

  const renderEvent = (entry, position) => {
    const li = document.createElement('li');
    li.className = 'event-item';
    if (entry.id) li.id = entry.id;

    const date = timeTag(entry.date, formatDate(entry.date));
    const rest = [entry.location, entry.result].filter(Boolean).map(esc);
    const meta = [date, ...rest].join(' / ');

    li.innerHTML = `
      <article class="event-card card--ink">
        <div class="card-head">
          <h3 class="event-title">${esc(entry.title)}</h3>
          <span class="index-num">${pad(position)}</span>
        </div>
        <div class="meta">${meta}</div>
        <p class="event-note">${esc(entry.description || '')}</p>
        <div class="card-foot">
          <div class="tags">${tagMarkup(entry.tags)}</div>
        </div>
      </article>
    `;
    return li;
  };

  const loadJson = (url) => fetch(url, { cache: 'no-cache' }).then((response) => {
    if (!response.ok) throw new Error(`Failed to load ${url} (${response.status})`);
    return response.json();
  });

  loadJson('/data/certificates.json')
    .then((data) => {
      const certs = Array.isArray(data) ? data : [];
      certGrid.innerHTML = '';
      certs.forEach((cert, i) => {
        if (cert.id) byId.set(cert.id, cert);
        certGrid.appendChild(renderCertCard(cert, i + 1));
      });
      setCount(certCount, certs.length);

      // restore a deep link like /portfolio.html#cert-spring (the old :target
      // fragments still resolve); ignore section anchors such as #certificates
      const hash = location.hash ? location.hash.slice(1) : '';
      if (hash && byId.has(hash)) openCert(hash);
    })
    .catch((error) => {
      console.error(error);
      certGrid.innerHTML = '<p class="portfolio-empty">Certificates are unavailable right now.</p>';
      if (certCount) certCount.textContent = 'unavailable';
      if (status) status.textContent = 'certificates are unavailable right now';
    });

  loadJson('/data/events.json')
    .then((data) => {
      const events = Array.isArray(data) ? data : [];
      eventList.innerHTML = '';
      events.forEach((entry, i) => eventList.appendChild(renderEvent(entry, i + 1)));
      setCount(eventCount, events.length);
    })
    .catch((error) => {
      console.error(error);
      eventList.innerHTML = '<li class="event-item"><p class="portfolio-empty">Events are unavailable right now.</p></li>';
      if (eventCount) eventCount.textContent = 'unavailable';
    });
})();
