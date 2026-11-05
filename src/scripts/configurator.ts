// Connects the configurator's markup (Configurator.astro) to its logic
// (src/lib/configurator.ts). Choices that get hidden sit in a disabled fieldset, so
// they aren't submitted with the form, but are remembered if the option comes back.

import Alpine from 'alpinejs';
import { formatPrice } from '../data/site';
import { evaluate, picksFromParams, picksToParams, type ProductConfig } from '../lib/configurator';

const isSmallScreen = () => window.matchMedia('(width < 48rem)').matches;

Alpine.data('configurator', (config: ProductConfig) => {
  const picks = picksFromParams(config, new URLSearchParams(location.search));
  return {
    picks,
    view: evaluate(config, picks),
    // A shared link opens on the review.
    step: location.hash === '#review' ? config.steps.length : 0,
    expanded: false,
    copied: false,
    formatPrice,

    get shareUrl() {
      const query = picksToParams(config, this.picks).toString();
      return `${location.origin}${location.pathname}${query && `?${query}`}#review`;
    },

    get breakdown() {
      return this.view.lines.map((line) => `${line.label}: ${line.choice} (${formatPrice(line.price)})`).join('\n');
    },

    isVisible(option: string) {
      return this.view.visible.includes(option);
    },

    isChecked(radio: HTMLInputElement) {
      const lock = this.view.locks[radio.name];
      return (lock ?? this.picks[radio.name]) === radio.value;
    },

    isLocked(radio: HTMLInputElement) {
      const lock = this.view.locks[radio.name];
      return lock !== undefined && lock !== radio.value;
    },

    messageFor(option: string) {
      return this.view.messages[option]?.join(' ') ?? '';
    },

    stepDone(step: number) {
      return !this.view.missing.some((item) => item.step === step);
    },

    choose(radio: HTMLInputElement) {
      this.picks = { ...this.picks, [radio.name]: radio.value };
      this.view = evaluate(config, this.picks);
      const query = picksToParams(config, this.picks).toString();
      history.replaceState(null, '', `${location.pathname}${query && `?${query}`}`);
      this.copied = false;
    },

    goTo(step: number) {
      this.step = step;
      this.expanded = false;
      this.$nextTick(() => {
        const headings = this.$root.querySelectorAll<HTMLElement>('[data-step-heading]');
        headings[step]?.focus({ preventScroll: true });
        const stepper = this.$refs.stepper;
        if (stepper.getBoundingClientRect().top < 100) stepper.scrollIntoView();
        // The steps can overflow on small screens; keep the current one in view.
        const current = stepper.querySelector<HTMLElement>('[aria-current="step"]');
        if (current) stepper.scrollTo({ left: current.offsetLeft - 20, behavior: 'smooth' });
      });
    },

    async copyLink() {
      await navigator.clipboard.writeText(this.shareUrl);
      this.copied = true;
    },

    togglePreview() {
      if (isSmallScreen()) this.expanded = !this.expanded;
    },

    // Hovering with a mouse zooms the preview to 2x, following the pointer.
    zoom(event: PointerEvent) {
      if (event.pointerType !== 'mouse' || isSmallScreen()) return;
      const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const x = ((event.clientX - box.left) / box.width) * 100;
      const y = ((event.clientY - box.top) / box.height) * 100;
      this.$refs.preview.style.transformOrigin = `${x}% ${y}%`;
      this.$refs.preview.style.transform = 'scale(2)';
    },

    unzoom() {
      this.$refs.preview.style.transform = '';
    },
  };
});

Alpine.start();
