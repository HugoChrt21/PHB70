const MOBILE_BREAKPOINT = 768;

export async function initApproach() {
  const section = document.querySelector('.approach');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!section || reduceMotion) return undefined;

  const { gsap } = await import('../assets/vendor/gsap/index.js');
  const { ScrollTrigger } = await import('../assets/vendor/gsap/ScrollTrigger.js');

  if (!gsap || !ScrollTrigger) return undefined;

  gsap.registerPlugin(ScrollTrigger);

  const context = gsap.context(() => {
    const intro = section.querySelector('.approach__intro');
    const steps = section.querySelectorAll('.making-step');
    const network = section.querySelector('.approach__years');

    if (intro) {
      gsap.from(intro.children, {
        opacity: 0,
        y: 24,
        duration: 0.78,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: { trigger: intro, start: 'top 76%', once: true }
      });
    }

    steps.forEach((step) => {
      const number = step.querySelector('.making-step__number');
      const copy = step.querySelector('.making-step__copy');
      const titleLines = step.querySelectorAll('.making-step__title-line');
      const paragraph = copy?.querySelector('p');
      const primaryMedia = step.querySelector('.making-step__media');
      const primaryImage = primaryMedia?.querySelector('img');
      const cover = primaryMedia?.querySelector('.media-reveal__cover');
      const scene = gsap.timeline({ scrollTrigger: { trigger: step, start: 'top 76%', once: true } });

      if (number) {
        scene.from(number, {
          opacity: 0,
          y: 28,
          duration: 0.95,
          ease: 'power3.out'
        });
      }

      if (titleLines.length) {
        scene.from(titleLines, {
          yPercent: 115,
          duration: 1.05,
          ease: 'power4.out',
          stagger: 0.09
        }, '-=0.55');
      }

      if (cover) {
        scene.to(cover, { scaleY: 0, transformOrigin: 'top center', duration: 1.2, ease: 'power4.inOut' }, '-=0.75');
      }

      if (primaryImage) {
        scene.fromTo(primaryImage, { scale: 1.035 }, { scale: 1, duration: 1.45, ease: 'power3.out' }, '<');
      }

      if (paragraph) {
        scene.from(paragraph, {
          opacity: 0,
          y: 22,
          duration: 0.85,
          ease: 'power3.out'
        }, '-=0.85');
      }

      if (primaryImage && window.innerWidth > MOBILE_BREAKPOINT && (step.classList.contains('making-step--feasibility') || step.classList.contains('making-step--production'))) {
        gsap.to(primaryImage, {
          y: -24,
          ease: 'none',
          scrollTrigger: {
            trigger: step,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2
          }
        });
      }
    });

    if (network) {
      gsap.from(network.children, {
        opacity: 0,
        y: 24,
        duration: 0.78,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: { trigger: network, start: 'top 78%', once: true }
      });
    }
  }, section);

  const cleanup = () => context.revert();
  window.addEventListener('pagehide', cleanup, { once: true });
  return cleanup;
}
