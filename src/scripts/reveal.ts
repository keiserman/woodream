// Adds `.revealed` to [data-reveal] elements, which slides their mask away
// (see the .mask rules in global.css). "load" elements reveal right away;
// "scroll" elements reveal once they enter the viewport.

const reveal = (el: Element) => el.classList.add('revealed');

requestAnimationFrame(() => {
  document.querySelectorAll('[data-reveal="load"]').forEach(reveal);
});

const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      reveal(entry.target);
      observer.unobserve(entry.target);
    }
  },
  { rootMargin: '0px 0px -10% 0px' },
);

document.querySelectorAll('[data-reveal="scroll"]').forEach((el) => observer.observe(el));
