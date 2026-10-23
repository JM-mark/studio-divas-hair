import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_ORIGIN, BASE_PATH } from './src/data/site-url.mjs';

// Fully static output for GitHub Pages (project site under a base path). The address lives in src/data/site-url.mjs.
export default defineConfig({
  site: SITE_ORIGIN, // 'https://jm-mark.github.io'
  base: BASE_PATH,   // '/studio-divas-hair'
  output: 'static',
  build: { inlineStylesheets: 'always' },
  integrations: [sitemap()],
});
