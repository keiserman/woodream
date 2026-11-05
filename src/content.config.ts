import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Collections live in src/content/. Entries are shown in `order`, and image
// paths are relative to the YAML file that references them.

// One YAML file per category in src/content/gallery/; the file name is the
// URL slug (/gallery/<slug>). Photos live in src/content/gallery/photos/ and
// can be shared between categories.
const gallery = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/gallery' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      /** Position on the Gallery page and in the category tabs. */
      order: z.number(),
      /** Position in the homepage gallery slider. */
      homeOrder: z.number(),
      cover: image(),
      photos: z.array(image()).min(1),
    }),
});

const testimonials = defineCollection({
  loader: file('src/content/testimonials.yaml'),
  schema: z.object({
    order: z.number(),
    quote: z.string(),
  }),
});

const processSteps = defineCollection({
  loader: file('src/content/process-steps.yaml'),
  schema: z.object({
    order: z.number(),
    title: z.string(),
    text: z.string(),
  }),
});

const woods = defineCollection({
  loader: file('src/content/woods.yaml'),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      /** Label for the configurator's comparison tabs; defaults to `name`. */
      shortName: z.string().optional(),
      order: z.number(),
      description: z.string(),
      seenIn: z.string(),
      image: image(),
      hoverImage: image(),
    }),
});

// The options, rules and layer order that products can share, one YAML file per
// set in src/content/option-sets/. Strict, so a misspelled field is an error
// rather than being ignored. See docs/product-configurator.md.
const condition = z.record(z.string(), z.string());
const thumbnail = z.strictObject({ x: z.number(), y: z.number(), zoom: z.number() });

const optionSets = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/option-sets' }),
  schema: z.strictObject({
    steps: z.array(
      z.strictObject({
        name: z.string(),
        options: z.array(
          z.strictObject({
            name: z.string(),
            label: z.string(),
            badge: z.string().optional(),
            /** Adds the link that opens the wood comparison. */
            woodDetails: z.boolean().default(false),
            showWhen: condition.optional(),
            /** Shows each choice as a crop of the preview: position in % and magnification. */
            thumbnail: thumbnail.optional(),
            choices: z
              .array(
                z.strictObject({
                  label: z.string(),
                  price: z.number().default(0),
                  layer: z.string().optional(),
                  /** A wood from the woods collection, shown as a photo on the choice. */
                  swatch: z.string().optional(),
                  selected: z.boolean().default(false),
                }),
              )
              .default([]),
          }),
        ),
      }),
    ),
    rules: z.array(z.strictObject({ if: condition, require: condition, message: z.string() })).default([]),
    layerOrder: z.array(z.string()),
  }),
});

// One YAML file per configurable product; the file name is the URL slug
// (/cabinets/<slug>) and the folder of the same name holds its images.
const products = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/products' }),
  schema: z.strictObject({
    name: z.string(),
    /** The option set this product is built from. */
    uses: z.string(),
    /** This product's prices where they differ: option name → choice label → price. */
    prices: z.record(z.string(), z.record(z.string(), z.number())).default({}),
    /** Options from the set that this product doesn't offer. */
    withoutOptions: z.array(z.string()).default([]),
    /** Layers from the set that have no artwork for this product. */
    withoutLayers: z.array(z.string()).default([]),
    /** Thumbnail crops where this product sits differently on its canvas: option name → crop. */
    thumbnails: z.record(z.string(), thumbnail).default({}),
  }),
});

export const collections = { gallery, testimonials, processSteps, woods, optionSets, products };
