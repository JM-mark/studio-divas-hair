# Studio Diva's Hair — site

Static marketing site (Astro + Tailwind CSS v4 + TypeScript) for **Studio Diva's Hair – Salão de Beleza**, Indaiatuba/SP. Content is pt-BR; the main conversion is booking via WhatsApp. Hosted free on **GitHub Pages**: https://jm-mark.github.io/studio-divas-hair/

## Run locally

```bash
npm install
npm run dev        # http://localhost:4321/studio-divas-hair/  (the site lives under a base path)
npm test           # unit tests for the opening-hours logic
npm run build      # static output in dist/
npm run preview    # serve dist/ locally
node scripts/verify-live.mjs   # crawl the live site: every page and asset must be 200
```

Node version: see `.nvmrc` (24).

## Edit content

Almost everything lives in **`src/data/site.ts`**: contact, hours, services (and optional prices), the "Sobre" text, reviews, and the `features.showClientPhotos` flag.

- **Address and base path:** one place, `src/data/site-url.mjs` (`SITE_ORIGIN` + `BASE_PATH`). Canonical URLs, Open Graph, JSON-LD, sitemap and `robots.txt` all follow it. Internal links and assets use `withBase()` from `src/lib/url.ts`, so they respect the base path (never hard-code a leading `/`).
- **Photos:** none of the client-uploaded photos are published or committed (`hero-interior.jpg`, `fachada.jpg`, `galeria-*.jpg` are git-ignored). While `features.showClientPhotos` is `false` the hero, "Sobre" panel and the gallery use brand-coloured panels, and the gallery and Instagram grid are hidden. When the owner sends her own photos: put them in `src/assets/images/` with those names (or edit `gallery` in `site.ts`), remove their lines from `.gitignore`, set the flag to `true`, update `src/data/image-credits.ts`, and push.
- **Reviews:** real public Google reviews with shortened names (`// TODO(owner): confirm permission`).
- **Brand:** tokens in `src/styles/brand-theme.css` (generated from `../brand/tokens.json`); logos in `public/logo/`.
- **`/marca`** (brand guidelines, `noindex`): `MSYS_NO_PATHCONV=1 node ../brand/guidelines-build.mjs --site public/marca --back /studio-divas-hair/`.

## Deploy (GitHub Pages)

Push to `main`. `.github/workflows/deploy.yml` builds with `withastro/action` and publishes with `actions/deploy-pages` (Pages source is set to "GitHub Actions"). The live URL is above.

## Using a real domain later

1. Register it at registro.br in the owner's name.
2. Add `public/CNAME` containing the domain (e.g. `www.example.com.br`).
3. Set the DNS records GitHub documents for Pages, then enable **Enforce HTTPS** in Settings → Pages.
4. In `src/data/site-url.mjs` set `SITE_ORIGIN` to the domain and `BASE_PATH` to `''` (commented example inside) and push.

## Google Search Console

Add the HTML-tag verification meta in `src/layouts/Layout.astro` (`<meta name="google-site-verification" ...>`), then submit `https://jm-mark.github.io/studio-divas-hair/sitemap-index.xml`. Note: crawlers only read `robots.txt` at a domain's root, so under this project-site address the sitemap must be submitted in Search Console (the `robots.txt` here is informational).

## Not committed

`.env` (API keys), `node_modules`, `dist`, the raw `brand-source/` files and the client photos listed above. `scripts/fetch-stock.ts` (Pexels/Pixabay) needs keys in `.env`; see `.env.example`.
