import { initHero } from './hero.js';
import { initApproach } from './approach.js';
import { initProjectBook } from './project-book.js';

try {
  initHero();
} catch (error) {
  document.body.classList.add('intro-complete');
  document.querySelector('[data-intro]')?.remove();
  console.error('PHB70 Hero initialization failed.', error);
}

void initApproach();
void initProjectBook();
