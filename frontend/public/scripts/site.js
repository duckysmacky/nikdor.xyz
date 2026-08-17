// Soft cross-fade for multipage navigation
(() => {
  const fadeClass = 'visible';

  // reveal as soon as the DOM is parsed — waiting for `load` would keep the
  // page hidden until every certificate iframe finished downloading
  const reveal = () => {
    requestAnimationFrame(() => {
      document.body.classList.add(fadeClass);
      document.documentElement.classList.add(fadeClass);
    });

    setActiveNav();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', reveal);
  } else {
    reveal();
  }

  // intercept links with data-link for soft fade — delegated on document so
  // this also covers cards injected later by JSON-driven pages
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-link]');
    if (!a) return;
    const href = a.getAttribute('href');
    // only intercept internal links
    if (!href || href.startsWith('http') || href.startsWith('mailto:')) return;
    e.preventDefault();
    // fade out
    document.documentElement.classList.remove('visible');

    setTimeout(() => {
      window.location.href = href;
    }, 100);
  });

  // set active nav item based on path
  function setActiveNav(){
    const path = window.location.pathname;

    document.querySelectorAll('.nav-list a').forEach(a=>{
      const item = a.closest('.nav-item') || a;
      item.classList.remove('active');
      const href = a.getAttribute('href');

      if(href === path || (href.endsWith('/') && path.startsWith(href))){
        item.classList.add('active');
      }
    });
  }
})();