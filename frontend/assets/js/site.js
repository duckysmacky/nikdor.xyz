// Soft cross-fade for multipage navigation
(() => {
  const body = document.documentElement;
  const links = Array.from(document.querySelectorAll('a[data-link]'));
  const fadeClass = 'visible';

  // on load show
  window.addEventListener('load', () => {
    requestAnimationFrame(() => {
      document.body.classList.add('visible');
      document.documentElement.classList.add('visible');
    });

    setActiveNav();
  });

  // intercept links with data-link for soft fade
  links.forEach(a => {
    a.addEventListener('click', (e) => {
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
  });

  // set active nav item based on path
  function setActiveNav(){
    const path = window.location.pathname;

    document.querySelectorAll('.nav-list a').forEach(a=>{
      a.classList.remove('active');
      const href = a.getAttribute('href');

      if(href === path || (href.endsWith('/') && path.startsWith(href))){
        a.classList.add('active');
      }
    });
  }
})();