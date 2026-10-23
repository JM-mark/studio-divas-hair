// Generates placeholder images + favicon/OG PNGs. Replace real photos later.
import sharp from 'sharp';
const svg = (w,h,c1,c2,label)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="50%" text-anchor="middle" font-family="Georgia,serif" font-size="${Math.round(w/22)}" fill="#ffffff" fill-opacity=".8">${label}</text></svg>`;
const jobs = [
 ['src/assets/images/hero-placeholder.jpg',1000,1250,'#8a2c4e','#d9a3a0','TODO foto: Dri no studio'],
 ['src/assets/images/sobre-adriana.jpg',900,1100,'#c98c8c','#6b1f3a','TODO foto: Adriana'],
 ...[1,2,3,4,5,6].map(i=>[`src/assets/images/galeria-${i}.jpg`,900,900,i%2?'#b5667f':'#e4b9b0',i%2?'#f1d5cd':'#8a2c4e',`TODO foto antes/depois ${i}`]),
];
for (const [f,w,h,a,b,l] of jobs) await sharp(Buffer.from(svg(w,h,a,b,l))).jpeg({quality:80}).toFile(f);
const icon = s=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><rect width="${s}" height="${s}" rx="${s/4}" fill="#6b1f3a"/><text x="50%" y="68%" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="${s*.55}" fill="#e3c27a">D</text></svg>`);
for (const s of [192,512]) await sharp(icon(s)).png().toFile(`public/icon-${s}.png`);
await sharp(icon(180)).png().toFile('public/apple-touch-icon.png');
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="100%" height="100%" fill="#6b1f3a"/><text x="600" y="290" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="92" fill="#fbf6f0">Studio Diva's Hair</text><text x="600" y="380" text-anchor="middle" font-family="Georgia,serif" font-size="40" fill="#e3c27a">Salão de Beleza · Centro de Indaiatuba</text><text x="600" y="460" text-anchor="middle" font-family="Georgia,serif" font-size="32" fill="#fbf6f0">★ 5,0 · 132 avaliações no Google</text></svg>`)).jpeg({quality:88}).toFile('public/images/og-image.jpg');
