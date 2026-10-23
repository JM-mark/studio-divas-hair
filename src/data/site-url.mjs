// The ONE place that sets the public address of the site. Plain .mjs so astro.config.mjs can import it too.
// GitHub Pages project site: https://jm-mark.github.io/studio-divas-hair/  (origin + base path).
export const SITE_ORIGIN = 'https://jm-mark.github.io';
export const BASE_PATH = '/studio-divas-hair'; // use '' for a root site or a custom domain
export const SITE_URL = SITE_ORIGIN + BASE_PATH;

// Later, with a registered domain (see README "Using a real domain"):
// export const SITE_ORIGIN = 'https://www.example.com.br';
// export const BASE_PATH = '';
