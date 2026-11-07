// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { SITE_URL } from "./src/consts.ts";
import { isNoindexRoute } from "./src/utils/seo.ts";

export default defineConfig({
  site: SITE_URL,
  integrations: [
    sitemap({
      filter: (page) => !isNoindexRoute(new URL(page).pathname),
    }),
  ],
  fonts: [
    {
      name: "PP Neue Montreal",
      cssVariable: "--font-neue-montreal",
      provider: fontProviders.local(),
      fallbacks: ["Arial", "sans-serif"],
      options: {
        variants: [
          {
            weight: 400,
            style: "normal",
            src: ["./src/assets/fonts/PPNeueMontreal-Book.woff2"],
          },
        ],
      },
    },
    {
      name: "PP Mori",
      cssVariable: "--font-mori",
      provider: fontProviders.local(),
      fallbacks: ["Arial", "sans-serif"],
      options: {
        variants: [
          {
            weight: 400,
            style: "normal",
            src: ["./src/assets/fonts/PPMori-Regular.woff2"],
          },
        ],
      },
    },
    {
      name: "DM Sans",
      cssVariable: "--font-dm-sans",
      provider: fontProviders.local(),
      fallbacks: ["sans-serif"],
      options: {
        variants: [
          {
            weight: 600,
            style: "normal",
            src: ["./src/assets/fonts/DMSans-SemiBold.woff2"],
          },
        ],
      },
    },
  ],
  vite: { build: { cssTarget: "safari15.4" } },
});
