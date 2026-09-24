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
      order: z.number(),
      description: z.string(),
      seenIn: z.string(),
      image: image(),
      hoverImage: image(),
    }),
});

export const collections = { gallery, testimonials, processSteps, woods };
