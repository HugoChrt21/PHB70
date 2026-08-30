const FLIP_DURATION = 1200;

const projects = [
  { category: 'Hôtellerie', index: '01', layout: 'hotel', caption: 'Chambres Superior Room', main: ['assets/images/book/hotel-01-main.jpg', 'Chambre Superior Room avec mobilier sur mesure PHB70'], detail: ['assets/images/book/hotel-01-detail-a.jpg', 'Détail d’une chambre Superior Room'], secondary: ['assets/images/book/hotel-01-detail-b.jpg', 'Intérieur hôtelier avec mobilier intégré'] },
  { category: 'Restauration', index: '02', layout: 'restaurant', caption: 'Aménagement de restauration', main: ['assets/images/book/restaurant-01-main.jpg', 'Restaurant avec fauteuils, tables et luminaires sur mesure'], detail: ['assets/images/book/restaurant-01-detail-b.jpg', 'Détail de mobilier dans un intérieur de restauration'], secondary: ['assets/images/book/restaurant-01-detail-a.jpg', 'Détail panoramique d’un espace de restauration'] },
  { category: 'Pièces d’exception', index: '03', layout: 'exception', caption: 'Mobilier d’exception', main: ['assets/images/book/exception-01-main.jpg', 'Composition de mobilier d’exception réalisée par PHB70'], detail: ['assets/images/book/exception-01-detail-b.jpg', 'Crédence Washington en mobilier d’exception'], secondary: ['assets/images/book/exception-01-detail-a.jpg', 'Bibliothèque Cortland réalisée sur mesure'] }
];

function imageFigure([src, alt], className) {
  const figure = document.createElement('figure');
  figure.className = `project-book__image project-book__image--${className}`;
  const image = new Image();
  image.src = src;
  image.alt = alt;
  image.width = 1024;
  image.height = 683;
  image.loading = 'eager';
  figure.append(image);
  return figure;
}

function projectPage(project, side) {
  const page = document.createElement('article');
  page.className = `project-book__page project-book__page--project project-book__page--${side} project-book__page--${project.layout}`;
  if (side === 'left') {
    page.classList.add('project-book__page--single');
    page.append(imageFigure(project.main, 'main'));
    const meta = document.createElement('div');
    meta.className = 'project-book__page-meta';
    const category = document.createElement('p');
    category.className = 'project-book__category';
    category.textContent = project.category;
    const index = document.createElement('p');
    index.className = 'project-book__index';
    index.textContent = project.index;
    meta.append(category, index);
    page.append(meta);
  } else {
    page.classList.add('project-book__page--multi');
    page.append(imageFigure(project.detail, 'primary'));
    const caption = document.createElement('p');
    caption.className = 'project-book__caption';
    caption.textContent = project.caption;
    page.append(caption);
  }
  return page;
}

function coverPage(kind) {
  const page = document.createElement('article');
  page.className = `project-book__page project-book__page--${kind}`;
  page.dataset.density = 'hard';
  const word = document.createElement(kind === 'cover' ? 'div' : 'p');
  word.className = kind === 'cover' ? 'project-book__cover-lockup' : 'project-book__end-word';
  if (kind === 'cover') {
    const logo = document.createElement('img');
    logo.className = 'project-book__cover-logo';
    logo.src = 'assets/brand/phb70-logo.svg';
    logo.alt = 'PHB70';
    const title = document.createElement('p');
    title.textContent = 'Réalisations';
    word.append(logo, title);
  } else {
    word.textContent = 'PHB70\nMobilier sur mesure';
  }
  const meta = document.createElement('p');
  meta.className = kind === 'cover' ? 'project-book__cover-meta' : 'project-book__end-meta';
  meta.textContent = kind === 'cover' ? 'Sélection 01 — 03' : 'Paris · New York · Luxembourg · Portugal';
  page.append(word, meta);
  return page;
}

function editorialPage() {
  const page = document.createElement('article');
  page.className = 'project-book__page project-book__page--editorial';
  const title = document.createElement('p');
  title.className = 'project-book__cover-word';
  title.textContent = 'PHB70\nMobilier sur mesure';
  const copy = document.createElement('p');
  copy.className = 'project-book__end-meta';
  copy.textContent = 'Développement & production\nParis · New York · Luxembourg · Portugal';
  page.append(title, copy);
  return page;
}

function detailPage(project) {
  const page = document.createElement('article');
  page.className = `project-book__page project-book__page--project project-book__page--detail project-book__page--${project.layout}`;
  page.append(imageFigure(project.secondary, 'main'));
  const meta = document.createElement('div');
  meta.className = 'project-book__page-meta';
  const label = document.createElement('p');
  label.className = 'project-book__category';
  label.textContent = `${project.category} — détails`;
  meta.append(label);
  page.append(meta);
  return page;
}

function createPages() {
  const pages = [coverPage('cover'), editorialPage()];
  projects.forEach((project) => pages.push(projectPage(project, 'left'), projectPage(project, 'right'), detailPage(project)));
  pages.push(coverPage('end'));
  return pages;
}

export async function initProjectBook() {
  const root = document.querySelector('.project-book');
  const bookElement = root?.querySelector('[data-project-book-book]');
  if (!root || !bookElement) return undefined;

  const previousButtons = root.querySelectorAll('[data-project-book-previous]');
  const nextButtons = root.querySelectorAll('[data-project-book-next]');
  const currentOutput = root.querySelector('[data-project-book-current]');
  const totalOutput = root.querySelector('[data-project-book-total]');
  const status = root.querySelector('[data-project-book-status]');
  const hint = root.querySelector('[data-project-book-hint]');
  const shell = root.querySelector('.project-book__shell');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pages = createPages();
  let pageFlip;
  let interacted = false;
  let isFlipping = false;
  let transitionUpdateQueued = false;
  let coverCloseQueued = false;

  const setButtonsLocked = (locked, page) => {
    const isFirstPage = page === 0;
    const isLastPage = page >= pages.length - 1;
    previousButtons.forEach((button) => { button.disabled = locked || isFirstPage; });
    nextButtons.forEach((button) => { button.disabled = locked || isLastPage; });
  };

  const updateControls = (page = 0) => {
    const currentProject = Math.min(projects.length, Math.max(1, Math.ceil(Math.max(1, page - 1) / 3)));
    currentOutput.textContent = String(currentProject).padStart(2, '0');
    totalOutput.textContent = String(projects.length).padStart(2, '0');
    setButtonsLocked(isFlipping, page);
    status.textContent = page === 0 ? 'Couverture du livre PHB70.' : `Réalisation ${currentProject} sur ${projects.length}.`;
  };

  const hideHint = () => {
    if (!interacted) {
      interacted = true;
      hint?.classList.add('is-hidden');
    }
  };

  const syncPageFlipAfterShellTransition = () => {
    if (!shell || transitionUpdateQueued) return;
    if (reducedMotion) {
      requestAnimationFrame(() => pageFlip?.update());
      return;
    }
    transitionUpdateQueued = true;
    const onTransitionEnd = (event) => {
      if (event.target !== shell || event.propertyName !== 'width') return;
      transitionUpdateQueued = false;
      pageFlip?.update();
      shell.classList.remove('is-closing');
      shell.removeEventListener('transitionend', onTransitionEnd);
    };
    shell.addEventListener('transitionend', onTransitionEnd);
  };

  const openBook = () => {
    if (!shell || shell.classList.contains('is-open')) return;
    shell.classList.remove('is-closing');
    shell.classList.remove('is-closed');
    shell.classList.add('is-open');
    syncPageFlipAfterShellTransition();
  };

  const closeBook = () => {
    if (!shell || shell.classList.contains('is-closed')) return;
    shell.classList.remove('is-open');
    shell.classList.add('is-closed', 'is-closing');
    syncPageFlipAfterShellTransition();
  };

  const closeAfterCoverSettles = () => {
    if (!shell || coverCloseQueued) return;
    coverCloseQueued = true;
    requestAnimationFrame(() => {
      coverCloseQueued = false;
      if (pageFlip?.getState() === 'read' && pageFlip.getCurrentPageIndex() === 0) closeBook();
    });
  };

  const fallback = () => {
    bookElement.replaceChildren(projectPage(projects[0], 'left'), projectPage(projects[0], 'right'));
    bookElement.classList.add('is-fallback');
    totalOutput.textContent = String(projects.length).padStart(2, '0');
    previousButtons.forEach((button) => { button.disabled = true; });
    nextButtons.forEach((button) => { button.disabled = true; });
  };

  if (!window.St?.PageFlip) {
    fallback();
    return undefined;
  }

  bookElement.replaceChildren(...pages);
  shell?.classList.add('is-closed', 'is-initializing');
  shell?.classList.remove('is-open');
  pageFlip = new window.St.PageFlip(bookElement, {
    width: 560,
    height: 720,
    size: 'stretch',
    minWidth: 280,
    maxWidth: 780,
    minHeight: 360,
    maxHeight: 900,
    drawShadow: true,
    maxShadowOpacity: 0.16,
    flippingTime: reducedMotion ? 1 : FLIP_DURATION,
    usePortrait: true,
    showCover: true,
    mobileScrollSupport: true,
    swipeDistance: 24,
    clickEventForward: true,
    useMouseEvents: true,
    disableFlipByClick: false
  });
  pageFlip.loadFromHTML(pages);
  updateControls(0);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      pageFlip?.update();
      shell?.classList.remove('is-initializing');
      shell?.classList.add('is-ready');
    });
  });

  pageFlip.on('flip', (event) => {
    hideHint();
    updateControls(event.data);
  });
  pageFlip.on('changeState', (event) => {
    if (event.data === 'user_fold') {
      hideHint();
      openBook();
      return;
    }
    if (event.data === 'flipping') {
      isFlipping = true;
      setButtonsLocked(true, pageFlip?.getCurrentPageIndex() ?? 0);
      return;
    }
    if (event.data === 'read') {
      const currentPage = pageFlip?.getCurrentPageIndex() ?? 0;
      isFlipping = false;
      if (currentPage === 0) closeAfterCoverSettles();
      else openBook();
      updateControls(currentPage);
    }
  });

  const previous = () => {
    if (!pageFlip || isFlipping) return;
    hideHint();
    openBook();
    if (reducedMotion) {
      pageFlip.turnToPrevPage();
      const currentPage = pageFlip.getCurrentPageIndex();
      if (currentPage === 0) closeBook();
      updateControls(currentPage);
      return;
    }
    pageFlip.flipPrev('bottom');
  };
  const next = () => {
    if (!pageFlip || isFlipping) return;
    hideHint();
    openBook();
    if (reducedMotion) {
      pageFlip.turnToNextPage();
      updateControls(pageFlip.getCurrentPageIndex());
      return;
    }
    pageFlip.flipNext('bottom');
  };
  const onKeydown = (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.target instanceof Element && event.target.matches('input, textarea, select, button')) return;
    if (event.key === 'ArrowLeft') previous();
    if (event.key === 'ArrowRight') next();
  };
  previousButtons.forEach((button) => button.addEventListener('click', previous));
  nextButtons.forEach((button) => button.addEventListener('click', next));
  document.addEventListener('keydown', onKeydown);

  try {
    const { gsap } = await import('../assets/vendor/gsap/index.js');
    const { ScrollTrigger } = await import('../assets/vendor/gsap/ScrollTrigger.js');
    if (gsap && ScrollTrigger && !reducedMotion) {
      gsap.registerPlugin(ScrollTrigger);
      gsap.from(root.querySelectorAll('.project-book__header, .project-book__stage, .project-book__controls'), { opacity: 0, y: 40, scale: 0.985, duration: 1.1, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: root, start: 'top 78%', once: true } });
    }
  } catch (error) { /* The book remains fully usable without its entry motion. */ }

  const cleanup = () => {
    previousButtons.forEach((button) => button.removeEventListener('click', previous));
    nextButtons.forEach((button) => button.removeEventListener('click', next));
    document.removeEventListener('keydown', onKeydown);
    pageFlip?.destroy();
  };
  window.addEventListener('pagehide', cleanup, { once: true });
  return cleanup;
}
