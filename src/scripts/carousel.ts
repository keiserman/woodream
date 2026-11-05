// Adds to Carousel.astro: the progress bar, autoplay and dragging with a mouse.
// Autoplay starts once the carousel is on screen, pauses while the pointer is
// over it, and ends at the last slide or as soon as someone takes over.

const AUTOPLAY_MS = 3000;
const DRAG_THRESHOLD = 5;
const DRAG_SETTLE_MS = 500;

for (const carousel of document.querySelectorAll<HTMLElement>('[data-carousel]')) {
  const track = carousel.querySelector<HTMLElement>('[data-carousel-track]')!;
  const bar = carousel.querySelector<HTMLElement>('[data-carousel-bar]')!;

  const slideWidth = () => (track.firstElementChild as HTMLElement).offsetWidth;
  const lastPosition = () => Math.round((track.scrollWidth - track.clientWidth) / slideWidth());
  const position = () => Math.round(track.scrollLeft / slideWidth());

  const updateBar = () => {
    bar.style.transform = `scaleX(${(position() + 1) / (lastPosition() + 1)})`;
  };
  track.addEventListener('scroll', updateBar, { passive: true });
  window.addEventListener('resize', updateBar);
  updateBar();

  let timer: number | undefined;
  let hovering = false;
  let onScreen = false;
  let stoppedForGood = false;
  const stop = () => clearInterval(timer);
  const start = () => {
    stop();
    if (!onScreen || hovering || stoppedForGood) return;
    timer = window.setInterval(() => {
      if (position() >= lastPosition()) return stop();
      track.scrollTo({ left: (position() + 1) * slideWidth(), behavior: 'smooth' });
    }, AUTOPLAY_MS);
  };

  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      start();
    }, { threshold: 0.5 }).observe(track);

    carousel.addEventListener('pointerenter', () => {
      hovering = true;
      stop();
    });
    carousel.addEventListener('pointerleave', () => {
      hovering = false;
      start();
    });

    const takeOver = () => {
      stoppedForGood = true;
      stop();
    };
    for (const type of ['pointerdown', 'wheel', 'touchstart', 'keydown', 'focusin']) {
      carousel.addEventListener(type, takeOver, { passive: true });
    }
  }

  // Touch screens scroll natively; a mouse needs dragging added.
  let dragStart: { x: number; scroll: number } | null = null;
  let dragged = false;
  track.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    dragStart = { x: event.clientX, scroll: track.scrollLeft };
    dragged = false;
  });
  window.addEventListener('pointermove', (event) => {
    if (!dragStart) return;
    const distance = event.clientX - dragStart.x;
    if (!dragged && Math.abs(distance) < DRAG_THRESHOLD) return;
    dragged = true;
    track.style.scrollSnapType = 'none';
    track.scrollLeft = dragStart.scroll - distance;
  });
  window.addEventListener('pointerup', () => {
    if (!dragStart) return;
    dragStart = null;
    if (!dragged) return;
    track.scrollTo({ left: position() * slideWidth(), behavior: 'smooth' });
    setTimeout(() => {
      track.style.scrollSnapType = '';
      dragged = false;
    }, DRAG_SETTLE_MS);
  });
  // A drag that ends on a link shouldn't follow it, or start dragging the link itself.
  track.addEventListener('click', (event) => {
    if (dragged) event.preventDefault();
  });
  track.addEventListener('dragstart', (event) => event.preventDefault());
}
