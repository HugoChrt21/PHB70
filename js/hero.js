const INTRO_KEY = 'phb70-intro-seen';
const INTRO_DURATION = 2050;

function getSessionValue(key) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function setSessionValue(key, value) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // The intro remains functional when browser storage is unavailable.
  }
}

function setupMenu() {
  const button = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.mobile-menu');

  if (!button || !menu) return;

  button.addEventListener('click', () => {
    const isOpen = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!isOpen));
    button.textContent = isOpen ? 'Menu' : 'Close';
    menu.hidden = isOpen;
  });
}

export function initHero() {
  const intro = document.querySelector('[data-intro]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const introSeen = getSessionValue(INTRO_KEY) === 'true';

  setupMenu();

  if (!intro || reduceMotion || introSeen) {
    document.body.classList.add('intro-complete');
    intro?.remove();
    return;
  }

  document.body.classList.add('intro-play');
  setSessionValue(INTRO_KEY, 'true');

  const finishIntro = () => {
    document.body.classList.add('intro-complete');
    intro.remove();
    window.setTimeout(() => document.body.classList.remove('intro-play'), 650);
  };

  window.setTimeout(finishIntro, INTRO_DURATION);
}
