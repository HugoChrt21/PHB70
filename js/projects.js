import { initMenu } from './hero.js';
import PhotoSwipeLightbox from '../assets/vendor/photoswipe/photoswipe-lightbox.esm.js';

const MOBILE_BREAKPOINT = 768;

function buildGalleries() {
  document.querySelectorAll('.projects-chapter').forEach((chapter) => {
    const gallery = document.createElement('div');
    gallery.className = 'justified-gallery';
    gallery.setAttribute('data-pswp-gallery', chapter.id);
    const rowPlan = chapter.id === 'hospitality' ? [4, 3, 4, 5] : chapter.id === 'restaurant' ? [4] : [5, 3];
    const figures = [...chapter.querySelectorAll('.project-image')];
    const links = figures.map((figure, index) => {
      const image = figure.querySelector('img');
      if (!image) return;
      const link = document.createElement('a');
      link.href = image.currentSrc || image.src;
      link.dataset.pswpWidth = image.getAttribute('width');
      link.dataset.pswpHeight = image.getAttribute('height');
      link.dataset.pswpGallery = chapter.id;
      link.style.setProperty('--image-ratio', `${image.width || Number(image.getAttribute('width'))} / ${image.height || Number(image.getAttribute('height'))}`);
      image.loading = index < 2 ? 'eager' : 'lazy';
      image.decoding = 'async';
      figure.replaceWith(link);
      link.append(figure);
      return link;
    });
    let cursor = 0;
    rowPlan.forEach((count) => {
      const row = document.createElement('div');
      row.className = 'justified-gallery__row';
      links.slice(cursor, cursor + count).forEach((link) => row.append(link));
      cursor += count;
      gallery.append(row);
    });
    if (cursor < links.length) { const row = document.createElement('div'); row.className = 'justified-gallery__row'; links.slice(cursor).forEach((link) => row.append(link)); gallery.append(row); }
    chapter.querySelectorAll('.project-sequence').forEach((sequence) => sequence.remove());
    chapter.append(gallery);
  });

  document.querySelectorAll('[data-pswp-gallery]').forEach((gallery) => {
    const lightbox = new PhotoSwipeLightbox({
      gallery,
      children: 'a',
      pswpModule: () => import('../assets/vendor/photoswipe/photoswipe.esm.js'),
      bgOpacity: 0.94,
      showHideAnimationType: 'fade'
    });
    lightbox.init();
  });

  const sizeRows = () => {
    document.querySelectorAll('.justified-gallery__row').forEach((row) => {
      const links = [...row.querySelectorAll('a')];
      if (window.innerWidth < 769) { links.forEach((link) => { link.style.flex = ''; }); return; }
      const gap = Number.parseFloat(getComputedStyle(row).gap) || 0;
      const available = row.clientWidth - gap * Math.max(0, links.length - 1);
      const ratioSum = links.reduce((sum, link) => sum + Number(link.style.getPropertyValue('--image-ratio').split('/')[0]) / Number(link.style.getPropertyValue('--image-ratio').split('/')[1]), 0);
      const height = available / ratioSum;
      links.forEach((link) => {
        const [width, imageHeight] = link.style.getPropertyValue('--image-ratio').split('/').map(Number);
        link.style.flex = `0 0 ${Math.floor(height * (width / imageHeight))}px`;
      });
    });
  };
  requestAnimationFrame(sizeRows);
  window.addEventListener('resize', sizeRows, { passive: true });
}

function promoteImage(image) {
  if (!image || image.dataset.preloaded === 'true') return;
  image.dataset.preloaded = 'true';
  image.loading = 'eager';
  if (!image.complete) return;
  image.decode?.().catch(() => undefined);
}

function prepareImages(main, ScrollTrigger) {
  const images = [...main.querySelectorAll('img[loading="lazy"]')];
  let refreshFrame;
  const refresh = () => {
    window.cancelAnimationFrame(refreshFrame);
    refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh());
  };

  images.forEach((image) => {
    image.addEventListener('load', refresh, { once: true });
    if (image.complete) refresh();
  });

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('img[loading="lazy"]').forEach(promoteImage);
      currentObserver.unobserve(entry.target);
    });
  }, { rootMargin: '900px 0px' });

  main.querySelectorAll('[data-project-image], [data-project-composition]').forEach((element) => observer.observe(element));
  const exceptional = main.querySelector('#exceptional-pieces');
  if (exceptional) {
    const exceptionalObserver = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll('img[loading="lazy"]').forEach(promoteImage);
        currentObserver.unobserve(entry.target);
      });
    }, { rootMargin: '1400px 0px' });
    exceptionalObserver.observe(exceptional);
    return () => {
      observer.disconnect();
      exceptionalObserver.disconnect();
      window.cancelAnimationFrame(refreshFrame);
    };
  }

  return () => {
    observer.disconnect();
    window.cancelAnimationFrame(refreshFrame);
  };
}

async function decodeImages(images) {
  await Promise.all([...images].map((figure) => {
    const image = figure.querySelector('img');
    if (!image || image.complete) return image?.decode?.().catch(() => undefined);
    return new Promise((resolve) => {
      image.addEventListener('load', () => image.decode?.().catch(() => undefined).finally(resolve), { once: true });
      image.addEventListener('error', resolve, { once: true });
    });
  }));
}

function preparePaths(paths, gsap) {
  paths.forEach((path) => {
    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
  });
}

export async function initProjects() {
  initMenu();
  buildGalleries();

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const main = document.querySelector('.projects-page main');

  if (!main || reduceMotion) return undefined;

  try {
    const { gsap } = await import('../assets/vendor/gsap/index.js');
    const { ScrollTrigger } = await import('../assets/vendor/gsap/ScrollTrigger.js');

    if (!gsap || !ScrollTrigger) return undefined;

    gsap.registerPlugin(ScrollTrigger);
    let imageCleanup = () => undefined;
    const context = gsap.context(() => {
      const textBlocks = gsap.utils.toArray('[data-project-text]');
      const images = gsap.utils.toArray('[data-project-image]');
      const compositions = gsap.utils.toArray('[data-project-composition]');
      const spines = gsap.utils.toArray('.editorial-spine');
      const containedImages = new Set(compositions.flatMap((composition) => [...composition.querySelectorAll('[data-project-image]')]));
      imageCleanup = prepareImages(main, ScrollTrigger);

      const revealImages = async (elements, stagger = 0.08) => {
        const figures = [...elements];
        await decodeImages(figures);
        const innerImages = figures.map((image) => image.querySelector('img')).filter(Boolean);
        return gsap.timeline()
          .fromTo(figures, { clipPath: 'inset(6% 0 0 0)', autoAlpha: 0.8 }, { clipPath: 'inset(0 0 0 0)', autoAlpha: 1, duration: 1.22, ease: 'power4.out', stagger })
          .fromTo(innerImages, { scale: 1.025, y: 14 }, { scale: 1, y: 0, duration: 1.28, ease: 'power3.out', stagger }, '<');
      };

      preparePaths(spines.flatMap((spine) => [...spine.querySelectorAll('path')]), gsap);

      textBlocks.forEach((element) => {
        gsap.from(element, {
          autoAlpha: 0.45,
          y: 18,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 84%', once: true }
        });
      });

      images.filter((image) => !containedImages.has(image)).forEach((image) => {
        ScrollTrigger.create({
          trigger: image,
          start: 'top 84%',
          once: true,
          onEnter: () => { void revealImages([image], 0); }
        });
      });

      compositions.forEach((composition) => {
        const imagesInComposition = composition.querySelectorAll('[data-project-image]');
        ScrollTrigger.create({
          trigger: composition,
          start: 'top 80%',
          once: true,
          onEnter: () => {
            const paths = composition.querySelectorAll('.editorial-spine path');
            void decodeImages(imagesInComposition).then(() => {
              const timeline = gsap.timeline();
              timeline.to(paths, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut', stagger: 0.08 });
              timeline.add(revealImages(imagesInComposition, 0.1), 0.24);
            });
          }
        });
      });

      if (window.innerWidth > MOBILE_BREAKPOINT) {
        const parallaxImages = [
          '.project-image--superior-main img',
          '.project-image--restaurant-panorama img',
          '.project-image--exceptional-opening img',
          '.project-exceptional-single--washington .project-image img'
        ];

        parallaxImages.forEach((selector) => {
          const image = main.querySelector(selector);
          if (!image) return;
          gsap.to(image, {
            yPercent: -3,
            ease: 'none',
            scrollTrigger: { trigger: image.parentElement, start: 'top bottom', end: 'bottom top', scrub: 1.15 }
          });
        });
      }
    }, main);

    const cleanup = () => {
      imageCleanup();
      context.revert();
    };
    window.addEventListener('pagehide', cleanup, { once: true });
    return cleanup;
  } catch (error) {
    console.error('PHB70 Projects initialization failed.', error);
    return undefined;
  }
}

void initProjects();
