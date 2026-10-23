// Builds public/images/og-image.jpg (1200x630) from the hero poster + the reversed logo. Run after process-media.mjs.
import sharp from 'sharp';
const W = 1200, H = 630;
const poster = await sharp('public/media/hero-poster-d.webp').resize({ width: 640, height: H, fit: 'cover', position: 'attention' }).toBuffer();
const logo = await sharp('public/logo/logo-horizontal-reversed.svg', { density: 220 }).resize({ width: 470 }).png().toBuffer();
const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>
  <linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#14070c"/><stop offset=".52" stop-color="#14070c"/><stop offset="1" stop-color="#14070c" stop-opacity="0"/></linearGradient></defs>
  <rect width="100%" height="100%" fill="#2a0d1a"/></svg>`);
const fade = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>
  <linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#14070c" stop-opacity="1"/><stop offset=".48" stop-color="#14070c" stop-opacity="1"/><stop offset=".78" stop-color="#14070c" stop-opacity=".25"/><stop offset="1" stop-color="#14070c" stop-opacity="0"/></linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="72" y="360" font-family="Georgia, 'Times New Roman', serif" font-size="58" fill="#f8f1e8" font-weight="300">Cabelo lindo começa</text>
  <text x="72" y="428" font-family="Georgia, 'Times New Roman', serif" font-size="58" fill="#e8d5a8" font-style="italic">no cuidado</text>
  <text x="72" y="500" font-family="Arial, Helvetica, sans-serif" font-size="25" fill="#f8f1e8" letter-spacing="3">INDAIATUBA · SP</text>
  <text x="72" y="545" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#e8d5a8">★ 5,0 · 132 avaliações no Google</text></svg>`);
await sharp(bg).composite([
  { input: poster, left: W - 640, top: 0 },
  { input: fade, left: 0, top: 0 },
  { input: logo, left: 72, top: 96 },
]).jpeg({ quality: 86 }).toFile('public/images/og-image.jpg');
console.log('og-image.jpg written');
