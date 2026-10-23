// Rebuilds public/media from the licensed originals listed in src/data/image-credits.ts.
// Usage: node scripts/process-media.mjs [key]   (key = process only that photo, skipping the video; needs network for the first run; originals are cached in .media-cache/)
// Originals are fetched from the public Pexels image CDN and the Mixkit video CDN (no accounts, no API keys).
// Every image gets the same warm grade (burgundy-lifted shadows, golden mids) and is exported as AVIF + WebP.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { photoCredits } from '../src/data/image-credits.ts';

const CACHE = '.media-cache';
const OUT = 'public/media';
fs.mkdirSync(CACHE, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

// key -> crops. ratio = w/h of the crop; fx/fy = focal point (0-1) the crop is centred on; widths = exported widths.
const crops = {
  conversa:    [{ n: 'd', ratio: 16 / 10, fx: .5, fy: .45, widths: [1280, 2000] }, { n: 'm', ratio: 9 / 16, fx: .66, fy: .5, widths: [640, 900] }],
  diagnostico: [{ n: 'd', ratio: 16 / 10, fx: .5, fy: .62, widths: [1280, 2000] }, { n: 'm', ratio: 9 / 16, fx: .5, fy: .5, widths: [640, 900] }],
  cuidado:     [{ n: 'd', ratio: 16 / 10, fx: .5, fy: .5, widths: [1280, 2000] }, { n: 'm', ratio: 9 / 16, fx: .68, fy: .5, widths: [640, 900] }],
  resultado:   [{ n: 'd', ratio: 16 / 10, fx: .5, fy: .42, widths: [1280, 2000] }, { n: 'm', ratio: 9 / 16, fx: .64, fy: .5, widths: [640, 900] }],
  cabelo:      [{ n: 'c', ratio: 4 / 5, fx: .5, fy: .3, widths: [600, 900] }],
  unhas:       [{ n: 'c', ratio: 4 / 5, fx: .5, fy: .5, widths: [600, 900] }],
  estetica:    [{ n: 'c', ratio: 4 / 5, fx: .5, fy: .42, widths: [600, 900] }],
  sobre:       [{ n: 'c', ratio: 3 / 4, fx: .36, fy: .5, widths: [600, 900] }],
};

const download = async (url, file) => {
  if (fs.existsSync(file)) return;
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 Chrome/124' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
};

// One grade for everything: warm highlights, slightly lifted plum-tinted blacks, a touch less saturation.
const grade = (img) => img
  .recomb([[1.05, 0.03, 0], [0.01, 1.0, 0.01], [0, 0.03, 0.88]])
  .modulate({ saturation: 0.93, brightness: 0.98 })
  .linear([0.95, 0.95, 0.95], [9, 3, 8]);

const only = process.argv[2];
for (const c of photoCredits) {
  if (only && c.key !== only) continue;
  const file = path.join(CACHE, `pexels-${c.id}.jpg`);
  await download(`https://images.pexels.com/photos/${c.id}/pexels-photo-${c.id}.jpeg?auto=compress&cs=tinysrgb&w=2400`, file);
  const { width: W, height: H } = await sharp(file).metadata();
  for (const k of crops[c.key]) {
    let cw = W, ch = Math.round(W / k.ratio);
    if (ch > H) { ch = H; cw = Math.round(H * k.ratio); }
    const left = Math.min(W - cw, Math.max(0, Math.round(k.fx * W - cw / 2)));
    const top = Math.min(H - ch, Math.max(0, Math.round(k.fy * H - ch / 2)));
    for (const w of k.widths) {
      const base = grade(sharp(file).extract({ left, top, width: cw, height: ch }).resize(w, Math.round(w / k.ratio), { fit: 'cover' }));
      const name = path.join(OUT, `${c.key}-${k.n}-${w}`);
      await base.clone().avif({ quality: 48, effort: 6 }).toFile(`${name}.avif`);
      await base.clone().webp({ quality: 74 }).toFile(`${name}.webp`);
    }
  }
  console.log('photo', c.key, c.id);
}

if (only) process.exit(0);
// ---- Hero video (Pexels 36707549, 1080x1920): 0.8x slow motion, seamless ~10 s loop, same warm grade as the photos ----
import { videoCredit } from '../src/data/image-credits.ts';
const src = path.join(CACHE, `pexels-video-${videoCredit.id}.mp4`);
await download(videoCredit.file, src);
const ff = (args) => { const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' }); if (r.status !== 0) throw new Error('ffmpeg failed'); };
const GRADE = "colorchannelmixer=rr=1.05:rg=0.03:gr=0.01:gg=1:gb=0.01:bg=0.03:bb=0.88,eq=saturation=0.95:brightness=-0.01,lutrgb=r='val*0.95+9':g='val*0.95+3':b='val*0.95+8'";
const slow = path.join(CACHE, 'hero-slow.mp4'), loop = path.join(CACHE, 'hero-loop.mp4');
ff(['-i', src, '-an', '-vf', `${GRADE},setpts=1.25*PTS,fps=30`, '-c:v', 'libx264', '-crf', '10', '-preset', 'fast', slow]);
const dur = Number(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', slow]).stdout.toString());
const X = 0.6; // crossfade the tail into the head so the loop has no visible cut
ff(['-i', slow, '-filter_complex',
  `[0:v]split=3[a][b][c];[a]trim=start=${X}:end=${(dur - X).toFixed(3)},setpts=PTS-STARTPTS[body];[b]trim=start=${(dur - X).toFixed(3)}:end=${dur.toFixed(3)},setpts=PTS-STARTPTS[tail];` +
  `[c]trim=start=0:end=${X},setpts=PTS-STARTPTS[head];[tail][head]xfade=transition=fade:duration=${X}:offset=0[blend];[body][blend]concat=n=2:v=1:a=0[out]`,
  '-map', '[out]', '-c:v', 'libx264', '-crf', '10', '-preset', 'fast', loop]);
const enc = (vf, crf, maxrate, buf, out) => ff(['-i', loop, '-vf', vf, '-c:v', 'libx264', '-profile:v', 'main', '-crf', String(crf), '-maxrate', maxrate, '-bufsize', buf, '-preset', 'slow', '-movflags', '+faststart', '-an', out]);
enc('crop=1080:1296:0:300,scale=1080:1296,format=yuv420p', 28, '2.7M', '5M', path.join(OUT, 'hero-desktop.mp4')); // desktop panel (5:6), <= 4 MB
enc('scale=720:1280,format=yuv420p', 30, '0.95M', '2M', path.join(OUT, 'hero-mobile.mp4'));                   // portrait 720p, <= 1.5 MB
// Posters (the LCP element) = first frame of each video, already graded.
for (const [vf, name] of [['crop=1080:1296:0:300,scale=1000:1200', 'hero-poster-d'], ['scale=720:1280', 'hero-poster-m']]) {
  const png = path.join(CACHE, `${name}.png`);
  ff(['-i', loop, '-vf', vf, '-frames:v', '1', png]);
  const base = sharp(png);
  await base.clone().avif({ quality: 52, effort: 6 }).toFile(path.join(OUT, `${name}.avif`));
  await base.clone().webp({ quality: 78 }).toFile(path.join(OUT, `${name}.webp`));
}
console.log('done');
