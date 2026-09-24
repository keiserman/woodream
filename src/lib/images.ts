import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';

/**
 * Optimized URL for a photo used as a CSS background (banners, cards),
 * where <Image> can't be used. Never upscales past the source width.
 */
export async function backgroundUrl(src: ImageMetadata, width: number): Promise<string> {
  const image = await getImage({ src, format: 'avif', width: Math.min(width, src.width) });
  return image.src;
}
