// Circular label that trails the pointer inside [data-cursor-area] elements.
// The area gets `.cursor-on` while hovered; its direct .fake-cursor child follows with a lag.

const LAG = 0.15; // 0.08 slower … 0.25 snappier

type Area = { el: HTMLElement; cursor: HTMLElement; active: boolean; tx: number; ty: number; x: number; y: number };

const areas: Area[] = [...document.querySelectorAll<HTMLElement>('[data-cursor-area]')].flatMap((el) => {
  const cursor = el.querySelector<HTMLElement>(':scope > .fake-cursor');
  return cursor ? [{ el, cursor, active: false, tx: 0, ty: 0, x: 0, y: 0 }] : [];
});

if (areas.length && matchMedia('(pointer: fine)').matches) {
  let lastX: number | null = null;
  let lastY: number | null = null;

  const setTarget = (a: Area, clientX: number, clientY: number) => {
    const b = a.el.getBoundingClientRect();
    a.tx = Math.max(0, Math.min(clientX - b.left, b.width));
    a.ty = Math.max(0, Math.min(clientY - b.top, b.height));
    // Avoid a big jump the first time it shows
    if (!a.active) {
      a.x = a.tx;
      a.y = a.ty;
    }
  };

  const setActive = (a: Area, on: boolean) => {
    a.active = on;
    a.el.classList.toggle('cursor-on', on);
  };

  window.addEventListener('pointermove', (e) => {
    lastX = e.clientX;
    lastY = e.clientY;
  });

  for (const a of areas) {
    a.el.addEventListener('pointerenter', (e) => {
      setTarget(a, e.clientX, e.clientY);
      setActive(a, true);
    });
    a.el.addEventListener('pointermove', (e) => {
      setTarget(a, e.clientX, e.clientY);
      a.active = true;
    });
    a.el.addEventListener('pointerleave', () => setActive(a, false));
  }

  // Scrolling moves content under a still pointer, so re-check hover state.
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      if (lastX == null || lastY == null) return;
      for (const a of areas) {
        const b = a.el.getBoundingClientRect();
        const inside = lastX >= b.left && lastX <= b.right && lastY >= b.top && lastY <= b.bottom;
        if (inside) setTarget(a, lastX, lastY);
        setActive(a, inside);
      }
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('wheel', onScroll, { passive: true });

  const tick = () => {
    for (const a of areas) {
      a.x += (a.tx - a.x) * LAG;
      a.y += (a.ty - a.y) * LAG;
      a.cursor.style.transform = `translate(${a.x}px, ${a.y}px) translate(-50%, -50%)`;
    }
    requestAnimationFrame(tick);
  };
  tick();
}
