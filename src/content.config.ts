import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

// Each collection is a YAML list in src/content/. Entries are shown in `order`,
// and image paths are relative to the YAML file.

const gallery = defineCollection({
  loader: file('src/content/gallery.yaml'),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      /** Position on the Gallery page. */
      order: z.number(),
      /** Position in the homepage gallery slider. */
      homeOrder: z.number(),
      cover: image(),
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
