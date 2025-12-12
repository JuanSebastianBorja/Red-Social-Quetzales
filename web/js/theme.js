(function () {
  const STORAGE_KEY = 'quetzal-theme';
  const root = document.documentElement;

  function getSystemPreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function getStoredTheme() {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      if (value === 'dark' || value === 'light') {
        return value;
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  function applyTheme(theme) {
    root.classList.remove('light-theme', 'dark-theme');
    if (theme === 'dark') {
      root.classList.add('dark-theme');
    } else {
      root.classList.add('light-theme');
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      // ignore
    }
  }

  function updateButton(btn, theme) {
    const icon = btn.querySelector('.theme-toggle__icon');
    if (icon) {
      icon.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
    btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    btn.title = theme === 'dark' ? 'Tema oscuro' : 'Tema claro';
  }

  function initButtons(theme) {
    const buttons = document.querySelectorAll('[data-theme-toggle]');
    if (!buttons.length) return;

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const current = root.classList.contains('dark-theme') ? 'dark' : 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        updateButton(btn, next);
      });

      updateButton(btn, theme);
    });
  }

  function init() {
    var theme = getStoredTheme();
    if (theme !== 'dark' && theme !== 'light') {
      theme = getSystemPreference();
    }
    applyTheme(theme);
    initButtons(theme);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
