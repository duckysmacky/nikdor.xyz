// Reusable modal controller — body scroll lock, Escape/backdrop close,
// focus moved in on open and restored on close, native focus trap via
// `inert` on every other <body> child.
window.NikdorModal = (() => {
  const create = (root, options = {}) => {
    if (!root) return null;

    const closeSelector = options.closeSelector || '[data-modal-close]';
    const card = root.querySelector('.modal-card') || root;

    let lastFocused = null;
    let storedBodyPadding = '';

    const siblingLayers = () =>
      Array.from(document.body.children).filter(
        (el) => el !== root && el.tagName !== 'SCRIPT'
      );

    const open = () => {
      lastFocused = document.activeElement;

      root.removeAttribute('inert');
      root.setAttribute('aria-hidden', 'false');
      root.classList.add('is-visible');
      document.body.classList.add('modal-open');

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        storedBodyPadding = document.body.style.paddingRight;
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      siblingLayers().forEach((el) => el.setAttribute('inert', ''));

      const autofocusTarget = card.querySelector('[data-modal-autofocus]');
      const closeTarget = card.querySelector(closeSelector);
      const target = autofocusTarget || closeTarget || card;
      if (target === card) card.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });

      if (typeof options.onOpen === 'function') options.onOpen();
    };

    const close = () => {
      if (!root.classList.contains('is-visible')) return;

      root.classList.remove('is-visible');
      root.setAttribute('aria-hidden', 'true');
      root.setAttribute('inert', '');
      document.body.classList.remove('modal-open');
      document.body.style.paddingRight = storedBodyPadding;

      siblingLayers().forEach((el) => el.removeAttribute('inert'));

      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus({ preventScroll: true });
      }

      if (typeof options.onClose === 'function') options.onClose();
    };

    root.addEventListener('click', (event) => {
      if (event.target.closest(closeSelector)) close();
    });

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && root.classList.contains('is-visible')) close();
    });

    return {
      open,
      close,
      isOpen: () => root.classList.contains('is-visible'),
    };
  };

  return { create };
})();
