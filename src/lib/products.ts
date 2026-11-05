import type { ImageMetadata } from 'astro';
import { getCollection } from 'astro:content';
import { applyPrices, validate, type ProductConfig } from './configurator';

const images = import.meta.glob<{ default: ImageMetadata }>('/src/content/products/*/*.webp', { eager: true });

export interface Product {
  id: string;
  name: string;
  config: ProductConfig;
  base: ImageMetadata;
  layers: Record<string, ImageMetadata>;
  swatches: Record<string, ImageMetadata>;
}

/** Every product, joined with its option set and images. Stops the build if a setup has mistakes. */
export async function getProducts(): Promise<Product[]> {
  const sets = await getCollection('optionSets');
  const woods = await getCollection('woods');
  const swatches = Object.fromEntries(woods.map((wood) => [wood.id, wood.data.image]));
  const problems: string[] = [];

  const products = (await getCollection('products')).flatMap(({ id, data }) => {
    const report = (message: string) => problems.push(`${id}: ${message}`);

    const set = sets.find((candidate) => candidate.id === data.uses);
    if (!set) {
      report(`uses an option set that doesn't exist: "${data.uses}".`);
      return [];
    }

    const { config, errors } = applyPrices(set.data, data.prices);
    errors.forEach(report);

    const folder = `/src/content/products/${id}/`;
    const layers: Record<string, ImageMetadata> = {};
    for (const [path, image] of Object.entries(images)) {
      if (path.startsWith(folder)) layers[path.slice(folder.length, -'.webp'.length)] = image.default;
    }
    const { base, ...overlays } = layers;
    if (!base) report(`needs a base image at ${folder}base.webp.`);

    validate(config, { layers: new Set(Object.keys(overlays)), swatches: new Set(Object.keys(swatches)) }).forEach(report);

    return [{ id, name: data.name, config, base, layers: overlays, swatches }];
  });

  if (problems.length) {
    throw new Error(`Product setup problems:\n${problems.map((problem) => `  - ${problem}`).join('\n')}`);
  }
  return products;
}
