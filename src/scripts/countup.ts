// Counts [data-count-to] numbers up from 0 once they scroll into view.
// The final value is rendered in the HTML, so it still shows without JS.

const DURATION = 5000;
const DELAY = 300;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

const els = [...document.querySelectorAll<HTMLElement>('[data-count-to]')];

if (els.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const run = (el: HTMLElement) => {
    const target = Number(el.dataset.countTo);
    let start: number | null = null;
    const step = (now: number) => {
      start ??= now;
      const t = Math.min((now - start) / DURATION, 1);
      el.textContent = String(Math.round(target * easeOut(t)));
      if (t < 1) requestAnimationFrame(step);
    };
    setTimeout(() => requestAnimationFrame(step), DELAY);
  };

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      run(entry.target as HTMLElement);
    }
  });

  for (const el of els) {
    el.textContent = '0';
    observer.observe(el);
  }
}
