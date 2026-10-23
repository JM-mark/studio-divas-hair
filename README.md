# Studio Diva's Hair — site

Static marketing site (Astro + plain CSS + TypeScript; GSAP/ScrollTrigger from cdnjs for the pinned chapters) for **Studio Diva's Hair – Salão de Beleza**, Indaiatuba/SP. Content is pt-BR; the main conversion is booking via WhatsApp. Hosted free on **GitHub Pages**: https://jm-mark.github.io/studio-divas-hair/

## Run locally

```bash
npm install
npm run dev        # http://localhost:4321/studio-divas-hair/  (the site lives under a base path)
npm test           # unit tests for the opening-hours logic
npm run build      # static output in dist/
npm run preview    # serve dist/ locally
node scripts/verify-live.mjs   # crawl the live site: every page and asset must be 200
```

Node version: see `.nvmrc` (24; Astro 7 needs >= 22.23.4).

## Edit content

Almost everything lives in **`src/data/site.ts`**: contact, hours, services (and optional prices), the four chapters, the service cards, the "Sobre" text and reviews.

- **Address and base path:** one place, `src/data/site-url.mjs` (`SITE_ORIGIN` + `BASE_PATH`). Canonical URLs, Open Graph, JSON-LD, sitemap and `robots.txt` all follow it. Internal links and assets use `withBase()` from `src/lib/url.ts`, so they respect the base path (never hard-code a leading `/`).
- **Images and hero video:** illustrative stock under the Pexels License (commercial use allowed), listed with photographer, page and licence in `src/data/image-credits.ts` and kept as an internal record (the public `/creditos` page was removed; the Pexels License does not require attribution). `node scripts/process-media.mjs` re-downloads the originals from the public Pexels CDN (no keys) and rebuilds `public/media` (one warm grade, AVIF + WebP, responsive widths, hero video loop + posters); `node scripts/make-og.mjs` rebuilds the social image. Stock is never presented as the salon's work, Adriana or a client. **Client-uploaded photos are never committed** (`hero-interior.jpg`, `fachada.jpg`, `galeria-*.jpg` stay git-ignored, rights pending). When the owner sends her own photos, replace the matching entries in `image-credits.ts` and re-run the script.
- **Reviews:** real public Google reviews with shortened names (`// TODO(owner): confirm permission`).
- **Brand:** logos in `public/logo/` (the reversed version is used over dark and photos).
- **`/marca`** (brand guidelines, `noindex`): `MSYS_NO_PATHCONV=1 node ../brand/guidelines-build.mjs --site public/marca --back /studio-divas-hair/`.

## Guided booking ("Agende seu horário")

Static, no backend: `src/components/Booking.astro` (form) + `src/scripts/booking.ts` (behaviour) + two pure modules with unit tests:
`src/lib/slots.ts` (which days and times can be requested, from the opening hours in `site.ts`, 30-minute steps, today's past times and a 1-hour buffer hidden, São Paulo time) and `src/lib/booking.ts` (validation and the WhatsApp message, built only from validated values; `buildMessage` returns `null` unless service, day, time and name are all valid right now).
- The form lives on its own page, `/agendar/` (`src/pages/agendar.astro`); the home page has no booking section. Every booking CTA on the site (header Agendamentos button, hero, service cards, floating button, final band, footer, menu, 404) links to that page; service cards add `?categoria=cabelo` and the form highlights that category. The only static WhatsApp link is the general-questions one (`questionLink` in `site.ts`, prefilled "Olá! Vim pelo site e tenho uma dúvida:").
- A slot means "the salon is open", not "the slot is free": the Dri confirms on WhatsApp (the page says so). To use real availability later (Google Agenda booking page, a salon booking system), replace `slotsForDate` in `src/lib/slots.ts` (see the TODO at the top of that file); nothing else needs to change.
- Nothing is stored or sent anywhere except the `wa.me` link the visitor opens.

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

`node_modules`, `dist`, `.media-cache/` (downloaded originals), the raw `brand-source/` files and the client photos listed above.
