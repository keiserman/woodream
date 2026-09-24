// Minimal replacement for the Webflow slider: prev/next arrows, swipe,
// and a segmented progress bar that fills up to the current slide.

for (const slider of document.querySelectorAll<HTMLElement>('[data-slider]')) {
  const viewport = slider.querySelector<HTMLElement>('[data-slider-viewport]')!;
  const track = slider.querySelector<HTMLElement>('[data-slider-track]')!;
  const slides = [...track.children] as HTMLElement[];
  const segments = [...slider.querySelectorAll<HTMLButtonElement>('[data-slider-dot]')];
  const prev = slider.querySelector<HTMLButtonElement>('[data-slider-prev]');
  const next = slider.querySelector<HTMLButtonElement>('[data-slider-next]');
  let index = 0;

  const go = (i: number) => {
    index = Math.max(0, Math.min(i, slides.length - 1));
    track.style.transform = `translateX(${-index * viewport.offsetWidth}px)`;
    segments.forEach((seg, n) => {
      seg.classList.toggle('bg-black', n <= index);
      seg.classList.toggle('bg-[#c8c8c8]', n > index);
      seg.setAttribute('aria-current', n === index ? 'true' : 'false');
    });
    slides.forEach((slide, n) => slide.setAttribute('aria-hidden', String(n !== index)));
  };

  prev?.addEventListener('click', () => go(index - 1));
  next?.addEventListener('click', () => go(index + 1));
  segments.forEach((seg, n) => seg.addEventListener('click', () => go(n)));

  // Swipe
  let startX: number | null = null;
  viewport.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') startX = e.clientX;
  });
  viewport.addEventListener('pointerup', (e) => {
    if (startX == null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
  });

  // Keep the offset in step with the viewport width without animating.
  window.addEventListener('resize', () => {
    track.style.transition = 'none';
    go(index);
    track.offsetWidth;
    track.style.transition = '';
  });

  go(0);
}
