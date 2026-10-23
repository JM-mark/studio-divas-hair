/**
 * Fetches candidate stock photos for the service cards from the official Pexels and Pixabay APIs.
 * Run:  node scripts/fetch-stock.ts        (Node 22.6+ strips the types; keys come from .env)
 *
 * Output: brand-source/stock/candidates/<treatment>/*.jpg + metadata.json (photographer, URL, license note)
 *         brand-source/stock/contact-sheet.png  (3 best per treatment, for the owner to pick)
 *
 * NOT YET RUN: needs PEXELS_API_KEY and PIXABAY_API_KEY in .env (both free). Nothing downloaded so far.
 * Before using ANY image on the site: re-read the current Pexels and Pixabay license pages, confirm commercial use,
 * avoid editorial-only items, and record it in src/data/image-credits.ts and brand/IMAGE-CREDITS.md.
 * Stock is allowed only for the treatment cards; never for gallery, before/after, Instagram, Sobre, or as a team member/client.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', '..', 'brand-source', 'stock');
const env = Object.fromEntries(
  (fs.existsSync(path.resolve(import.meta.dirname, '..', '.env')) ? fs.readFileSync(path.resolve(import.meta.dirname, '..', '.env'), 'utf8') : '')
    .split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#') && l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
const PEXELS = process.env.PEXELS_API_KEY || env.PEXELS_API_KEY;
const PIXABAY = process.env.PIXABAY_API_KEY || env.PIXABAY_API_KEY;
if (!PEXELS || !PIXABAY) {
  console.error('Missing PEXELS_API_KEY and/or PIXABAY_API_KEY. Copy .env.example to .env and fill both (free keys).');
  process.exit(1);
}

const treatments: Record<string, string[]> = {
  corte: ['haircut salon', 'corte de cabelo feminino'],
  hidratacao: ['hair mask treatment', 'hidratação capilar'],
  matizacao: ['blonde toning', 'loiro platinado'],
  selagem: ['smooth shiny hair', 'selagem capilar'],
  'escova-progressiva': ['straight sleek hair blowout', 'escova progressiva'],
  manicure: ['manicure nails', 'unhas decoradas'],
};

interface Candidate { treatment: string; source: 'Pexels' | 'Pixabay'; id: string; photographer: string; pageUrl: string; imageUrl: string; license: string; query: string; file?: string }

async function pexels(q: string): Promise<Omit<Candidate, 'treatment' | 'query'>[]> {
  const r = await fetch(`https://api.pexels.com/v1/search?per_page=8&orientation=portrait&locale=pt-BR&query=${encodeURIComponent(q)}`, { headers: { Authorization: PEXELS! } });
  if (!r.ok) throw new Error(`Pexels ${r.status}`);
  const j: any = await r.json();
  return j.photos.map((p: any) => ({ source: 'Pexels' as const, id: String(p.id), photographer: p.photographer, pageUrl: p.url, imageUrl: p.src.large2x, license: 'Pexels License (verify current terms)' }));
}
async function pixabay(q: string): Promise<Omit<Candidate, 'treatment' | 'query'>[]> {
  const r = await fetch(`https://pixabay.com/api/?key=${PIXABAY}&image_type=photo&orientation=vertical&safesearch=true&per_page=8&lang=pt&q=${encodeURIComponent(q)}`);
  if (!r.ok) throw new Error(`Pixabay ${r.status}`);
  const j: any = await r.json();
  return j.hits.map((p: any) => ({ source: 'Pixabay' as const, id: String(p.id), photographer: p.user, pageUrl: p.pageURL, imageUrl: p.largeImageURL, license: 'Pixabay Content License (verify current terms)' }));
}

const all: Candidate[] = [];
for (const [treatment, queries] of Object.entries(treatments)) {
  const dir = path.join(root, 'candidates', treatment);
  fs.mkdirSync(dir, { recursive: true });
  for (const q of queries) {
    for (const fn of [pexels, pixabay]) {
      try {
        const hits = (await fn(q)).slice(0, 3);
        for (const h of hits) {
          const file = path.join(dir, `${h.source.toLowerCase()}-${h.id}.jpg`);
          if (!fs.existsSync(file)) fs.writeFileSync(file, Buffer.from(await (await fetch(h.imageUrl)).arrayBuffer()));
          all.push({ treatment, query: q, ...h, file: path.relative(root, file) });
        }
      } catch (e) { console.warn(`skip ${fn.name} "${q}":`, (e as Error).message); }
    }
  }
}
fs.writeFileSync(path.join(root, 'metadata.json'), JSON.stringify(all, null, 2));
console.log(`Downloaded ${all.length} candidates into ${root}. Build the contact sheet, review the faces/skin tones/logos, then record the chosen ones in image-credits.`);
