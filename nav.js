const menuToggle = document.getElementById('menuToggle');
const mobilePanel = document.getElementById('mobilePanel');
if (menuToggle && mobilePanel) {
  menuToggle.addEventListener('click', () => {
    mobilePanel.classList.toggle('open');
  });
  mobilePanel.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => mobilePanel.classList.remove('open'));
  });
}
