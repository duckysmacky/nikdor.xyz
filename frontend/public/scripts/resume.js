// Wires the hero "resume" button to the static #resume-modal via NikdorModal.
(() => {
  const trigger = document.querySelector('[data-modal-open="resume"]');
  const modalRoot = document.getElementById('resume-modal');
  if (!trigger || !modalRoot) return;

  const modal = window.NikdorModal.create(modalRoot);
  trigger.addEventListener('click', () => modal.open());
})();
