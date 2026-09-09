import { initMenu } from './hero.js';

initMenu();

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const { gsap } = await import('../assets/vendor/gsap/index.js');
  const { ScrollTrigger } = await import('../assets/vendor/gsap/ScrollTrigger.js');
  gsap.registerPlugin(ScrollTrigger);
  const context = gsap.context(() => {
    gsap.from('[data-expertise-reveal]', { opacity: 0, y: 18, duration: .8, ease: 'power3.out', stagger: .1 });
    document.querySelectorAll('[data-expertise-step]').forEach((element) => {
      gsap.from(element, { opacity: .85, y: 12, scale: 1.015, duration: .95, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 78%', once: true } });
    });
  });
  window.addEventListener('pagehide', () => context.revert(), { once: true });
}
