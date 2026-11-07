import type { ImageMetadata } from 'astro';
import { getCollection } from 'astro:content';

export interface GalleryPhoto {
  src: ImageMetadata;
  alt: string;
}

/** The photo's file name without its extension, in dev and in builds. */
const fileId = (image: ImageMetadata) =>
  image.src.split('?')[0].split('/').pop()!.split('.')[0];

/** Pairs each photo with its alt text from src/content/gallery-photos.yaml.
 * Stops the build if a photo has none. */
export async function withAlt(photos: ImageMetadata[], category: string): Promise<GalleryPhoto[]> {
  const alts = new Map((await getCollection('galleryPhotos')).map((entry) => [entry.id, entry.data.alt]));
  const missing: string[] = [];
  const result = photos.map((src) => {
    const alt = alts.get(fileId(src));
    if (!alt) missing.push(fileId(src));
    return { src, alt: alt ?? '' };
  });
  if (missing.length) {
    throw new Error(
      `Gallery "${category}": add alt text to src/content/gallery-photos.yaml for ${missing.join(', ')}.`,
    );
  }
  return result;
}
