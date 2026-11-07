# Lumos for Astro

This is **Lumos for Astro**, an Astro component framework styled with plain CSS
and custom properties. Do not apply conventions from **Lumos for Webflow**.
Project conventions live in `LUMOS.md` and `.agents/skills/`.

## Development

Start the dev server in background mode:

```
astro dev --background
```

Use `astro dev stop`, `astro dev status`, and `astro dev logs` to manage it.

## Astro documentation

Use the relevant [Astro documentation](https://docs.astro.build) before working
on these areas:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Building

Read [LUMOS.md](LUMOS.md) before adding pages, components, or styles.

## Skills

Task-specific procedures live in `.agents/skills/<name>/SKILL.md`, alongside
any scripts they need.

- `lumos-import-figma` — build pages or variables from a Figma file.
- `lumos-audit-props` — check prop order and tooltip consistency.
- `lumos-scaling-graphic` — build an editable graphic that scales as one piece.
- `lumos-import-webflow` — migrate a Webflow export and connect its CMS.
- `lumos-upgrade-version` — upgrade Lumos without losing customizations.

`.agents/skills/` is the source of truth. Claude Code loads the same skills from
relative symlinks in `.claude/skills/`. For each new skill, add
`.claude/skills/<name>` pointing to `../../.agents/skills/<name>`.

- Codex: use `$lumos-import-figma` or ask for the skill by name. Restart Codex
  if a new skill does not appear.
- Claude Code: use `/lumos-import-figma` or let it load the skill when relevant.
- Other assistants: read `SKILL.md` directly. Instructions are Markdown and
  scripts are Node.

## This site

Woodream's site (custom millwork), rebuilt on Lumos for Astro from the
Tailwind version on `main`. Everything above this section comes from Lumos;
keep it intact so upgrades merge cleanly.

Every page from `main` is ported: Home, About, Gallery (index and
`/gallery/<id>`), Dreamline, Contact, the product configurators
(`/cabinets/<id>`), the legal pages and the 404 page.

- Site settings live in `src/consts.ts`: name, description, URL, noindex
  routes, `NAV_LINKS` (read by `Nav` and `Footer`), `NAV_CTA`, `LEGAL_LINKS`,
  `CONTACT` (phone, email, WhatsApp) and `GALLERY_INTRO`.
- Brand tokens are in `src/styles/base.css`; fonts (PP Neue Montreal for
  text, PP Mori for headings, DM Sans for configurator labels) in
  `astro.config.mjs` and `src/assets/fonts/`.
- Beige sections use `theme="brand"`: in this site the brand theme is the
  beige surface (`--light-200`) with cream cards, not a wood-brown section.
  The wood brown is `--brand-500`, used for accents (selected choices,
  WhatsApp button, rule messages).
- Content collections are in `src/content.config.ts` and `src/content/`
  (gallery, testimonials, processSteps, woods, optionSets, products). After
  changing a schema, stop the dev server, delete `.astro/data-store.json` and
  `node_modules/.astro/data-store.json`, and restart.
- Product configurator: follow `docs/product-configurator.md` to add or
  change products, options, prices or rules. Run `npm test` after changing
  `src/lib/configurator.ts`; `npm run build` checks every product's setup.
- Legal pages are Markdown in `src/pages/legal/`, rendered by
  `src/layouts/LegalLayout.astro`.
- Forms (footer, contact, configurator) use Lumos `Form` with no `action` yet, so they
  show the success message without sending anything. Set `action` (or wire
  Netlify Forms) before launch.

### Changes to Lumos files

Read this before running `lumos-upgrade-version`. These files came from Lumos
(1.0.2) and were changed on purpose; everything not listed here is either
untouched Lumos or new to this site, which an upgrade cannot conflict with.

**Keep this list current.** Any change that edits a file shipped by Lumos
must update its entry here in the same change: what changed and why, plus
anything an upgrade should preserve or reconsider. New files are listed under
"Added to this site".

#### Lumos files changed

- `src/styles/base.css` — Woodream tokens: swatches (cream `--light-300`,
  beige `--light-200`, grey `--dark-600` added, black `--dark-900`, wood brown
  `--brand-500` with white `--brand-text`); `--secondary-*` (Mori) and
  `--tertiary-*` (DM Sans) font tokens and `--text-label` (0.9375rem, nav and
  link buttons) added; type scale resized to the old site (h1 40–110
  uppercase Mori, h2 35–47, text-main 20–23 with 1.1 line height, text-small
  18–20, normal letter spacing, regular weights since each font ships one
  weight); square `--radius-small`; fixed 20px site margin and gutter;
  fluid `--nav-height` (64–100); section spacing from the old site. Light
  theme: `--text-2` is the grey swatch, buttons are black with grey hover,
  link borders are solid text color. `.theme-brand` rewritten as the beige
  section theme (see above).
- `src/styles/patterns.css` — `.field-control`: transparent field with a 40%
  text-color border and `--text-small` text, matching the old forms.
- `src/components/Button.astro` — `link` variant restyled to the site's CTA
  (uppercase `--text-label`, solid underline that drops on hover) and given
  an `arrow` prop (default `true`) that adds Lumos's `arrow-full` icon; pass
  `arrow={false}` for Prev/Next/Back. Main buttons use `--radius-small` and
  `0.5em 0.875em` padding.
- `src/components/interactive/Slider.astro` — controls restyled: markers are
  a full-width segmented progress bar filled up to the current slide (1.5rem
  hit area, 0.25rem bar), and the steps are `Prev` / `Next` link buttons
  aligned right under it. Scrolling, dragging and keyboard behavior are
  unchanged. Added an `autoplay` prop (seconds per slide, off by default;
  Dreamline uses 3): starts once half in view, pauses on hover, stops at the
  last slide and for good on any drag, scroll, tap, key or focus. Skipped
  with reduced motion.
- `src/components/form/Form.astro` — field gap reduced to `--space-2`; every
  form on this site is compact.
- `src/components/form/Textarea.astro` — `labelHidden` prop added, matching
  `Input`.
- `src/components/global/Nav.astro` — links from `NAV_LINKS`, logo left,
  links centered and the `NAV_CTA` link button right (on small screens the
  Contact link moves into the menu instead); uppercase grey links, current
  page underlined from 64rem. Hides while scrolling down, returns on scroll
  up, and slides in on load. Lumos's toggle, Escape, click-outside and
  collapsing menu mechanism are kept.
- `src/components/global/Footer.astro` — rebuilt: optional photo banner
  (`banner` prop, `BannerPhoto`), phone/email, `NAV_LINKS`, logo, contact form
  and the legal bar; `variant="minimal"` keeps only the legal bar.
- `src/components/utility/BaseHead.astro` — preloads the brand fonts instead
  of Inter; favicon is `/favicon.png` with `/images/webclip.png` as the touch
  icon.
- `src/layouts/BaseLayout.astro` — nav overlaps by default; `footer` and
  `footerBanner` props passed to `Footer`; renders `WhatsAppButton` with the
  full footer.
- `src/consts.ts` — site values replaced; `NAV_LINKS`, `NAV_CTA`,
  `LEGAL_LINKS`, `CONTACT` and `GALLERY_INTRO` added; `/example-components`
  is noindex.
- `astro.config.mjs` — the three brand fonts replace Inter.
- `package.json` — renamed; `alpinejs` (configurator) and `@types/alpinejs`
  added, `test` script added.
- `src/pages/index.astro`, `src/pages/404.astro` — Lumos's pages replaced
  with the site's.
- `src/assets/logo/logo.svg` — Woodream logo (its `<style>` classes turned
  into fill attributes so they can't leak when inlined).
  `src/assets/fonts/inter-regular.woff2`, `public/favicon.svg` and
  `public/favicon.ico` removed; `public/og-image.jpg` replaced with a crop of
  the home hero.
- `AGENTS.md` — this "This site" section appended.

#### Added to this site

- `src/components/wrapper/Reveal.astro` — wipe (`up`/`down`/`left`), `rise`
  and `fade` entrance animations, on scroll or on load, with `delay`. Checks
  positions on scroll rather than using IntersectionObserver, because a fully
  clipped wipe never counts as visible to the observer. Finished wipes end at
  `inset(-0.5em)` so trimmed text (`text-box`) isn't clipped.
- `src/components/content/LayoutLabeled.astro` — the site's standard section
  layout: a dotted label in the left quarter, then the heading, intro and
  content on the right, both under a top border.
- `src/components/content/HeroMain.astro` — page title (optionally two lines,
  the second indented) with an intro and an `action` slot.
- `src/components/content/BannerPhoto.astro` — full-width photo with
  uppercase white text; `hero` sits under the title with the "scroll down"
  cursor, `cta` closes the page (used by `Footer`).
- `src/components/content/CursorLabel.astro` — the circle label that trails
  the pointer over its parent ("Explore more", "scroll down"); fine pointers
  from 64rem only.
- `src/components/content/CardGallery.astro`, `AboutIntro.astro` — Home page
  blocks.
- `src/components/content/ListRow.astro` — bordered list rows that fade in:
  `step` (Home process), `feature` (Home "How we work"), `wood` (About; the
  sample fades to a room photo on hover) and `approach` (About; text opens on
  hover or keyboard focus). Uses `src/assets/icons/arrow-diagonal.svg`.
- `src/components/content/StatList.astro` — figures that count up when
  scrolled into view (About).
- `src/components/content/PhotoPair.astro` — two photos, `offset` (with a
  caption) or `split` (About).
- `src/components/content/ContactBlock.astro` — photo panel beside the
  contact form (Contact). `BannerPhoto` has a `panel` variant for it.
- `src/components/content/GalleryStagger.astro` — staggered category grid
  (Gallery); `GalleryNav.astro` and `GalleryPhotos.astro` (photo grid with
  its own lightbox) — gallery category pages.
- `src/components/content/HeroSplit.astro`, `CardProduct.astro`,
  `CardStep.astro` — Dreamline hero and slider cards.
- `HeroMain` has `size="compact"` for the smaller title on Gallery, Contact
  and the legal pages.
- `src/components/section/Configurator.astro` and
  `src/components/content/ConfiguratorOption.astro`,
  `ConfiguratorReview.astro`, `WoodCompare.astro` — the product configurator
  (Alpine.js); logic stays in `src/lib/configurator.ts`.
- `src/components/global/WhatsAppButton.astro` — floating WhatsApp link.
- `src/utils/format.ts` — `formatPrice`.
- `src/pages/cabinets/[id].astro` — one page per product.
- `src/pages/about.astro`, `contact.astro`, `dreamline.astro`,
  `gallery/index.astro`, `gallery/[id].astro`, `legal/*.md` and
  `src/layouts/LegalLayout.astro`.
- `src/content/`, `src/content.config.ts`, `src/lib/`, `docs/`,
  `src/assets/images/`, `src/assets/fonts/`, `public/images/` — carried over
  from `main`.
- `CLAUDE.md` — symlink to `AGENTS.md`.
