// Keeps a product configurator in sync with its selection (see Configurator.astro).
// Options that are switched off sit in a disabled fieldset, so their choices stop
// counting towards the price and the preview, and aren't submitted with the form,
// but are remembered if the option comes back.

import { formatPrice } from '../data/site';

const form = document.querySelector<HTMLFormElement>('form[data-configurator]')!;
const fieldsets = form.querySelectorAll<HTMLFieldSetElement>('fieldset[data-show-when]');
const layers = form.querySelectorAll<HTMLImageElement>('img[data-layer]');
const price = form.querySelector<HTMLElement>('[data-price]')!;
const priceInput = form.querySelector<HTMLInputElement>('[data-price-input]')!;

const isActive = (id: string) => document.getElementById(id)?.matches(':checked:enabled') ?? false;

function update() {
  // In page order: an option can depend on one above it that was just switched off.
  for (const fieldset of fieldsets) {
    const show = isActive(fieldset.dataset.showWhen!);
    fieldset.hidden = !show;
    fieldset.disabled = !show;
  }

  for (const layer of layers) {
    layer.hidden = !isActive(layer.dataset.layer!);
  }

  const total = [...form.querySelectorAll<HTMLInputElement>('input[type="radio"]:checked:enabled')].reduce(
    (sum, radio) => sum + Number(radio.dataset.price),
    0,
  );
  price.textContent = formatPrice(total);
  priceInput.value = formatPrice(total);
}

form.addEventListener('change', update);
// Browsers can restore earlier selections when a page is reloaded.
update();

// Hovering with a mouse zooms the preview to 2x, following the pointer.
const zoom = form.querySelector<HTMLElement>('[data-preview-zoom]')!;
const preview = form.querySelector<HTMLElement>('[data-preview]')!;

zoom.addEventListener('pointermove', (event) => {
  if (event.pointerType !== 'mouse') return;
  const box = zoom.getBoundingClientRect();
  preview.style.transformOrigin = `${((event.clientX - box.left) / box.width) * 100}% ${((event.clientY - box.top) / box.height) * 100}%`;
  preview.style.transform = 'scale(2)';
});

zoom.addEventListener('pointerleave', () => {
  preview.style.transform = '';
});
