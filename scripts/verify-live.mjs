// Crawls the live site: every page, then every asset/link that page references. Reports anything that is not 200.
// Usage: node scripts/verify-live.mjs [https://jm-mark.github.io/studio-divas-hair/]
import { SITE_URL } from '../src/data/site-url.mjs';

const root = (process.argv[2] ?? SITE_URL).replace(/\/?$/, '/');
const origin = new URL(root).origin;
const pages = ['', 'agendar/', 'marca/'];
const seen = new Map();
const problems = [];

const check = async (url, from) => {
  if (seen.has(url)) return seen.get(url);
  let status = 0;
  try { status = (await fetch(url, { redirect: 'follow' })).status; } catch (e) { status = -1; }
  seen.set(url, status);
  if (status !== 200) problems.push(`${status} ${url}  (from ${from})`);
  return status;
};

const refs = (html, base) => {
  const out = new Set();
  for (const m of html.matchAll(/\b(?:href|src)="([^"#][^"]*)"/g)) out.add(m[1]);
  // meta content is only a URL for image/url tags (og:image, twitter:image, og:url)
  for (const m of html.matchAll(/<meta\s+(?:property|name)="(?:og:image|og:url|twitter:image)"\s+content="([^"]+)"/g)) out.add(m[1]);
  for (const m of html.matchAll(/\bsrcset="([^"]+)"/g)) m[1].split(',').forEach((s) => out.add(s.trim().split(/\s+/)[0]));
  for (const m of html.matchAll(/url\(([^)]+)\)/g)) out.add(m[1].replace(/['"]/g, ''));
  return [...out]
    .filter((r) => !/^(mailto:|tel:|data:|javascript:)/.test(r))
    .map((r) => { try { return new URL(r, base).href; } catch { return null; } })
    .filter(Boolean);
};

for (const p of pages) {
  const url = root + p;
  const res = await fetch(url);
  console.log(res.status, url, res.url === url ? '' : `-> ${res.url}`);
  if (res.status !== 200) { problems.push(`${res.status} ${url}`); continue; }
  const html = await res.text();
  for (const r of refs(html, url)) {
    const u = new URL(r);
    if (u.origin !== origin) continue; // external links are not ours to check
    if (u.pathname.startsWith(new URL(root).pathname) === false) { problems.push(`OUTSIDE BASE ${r}  (from ${url})`); continue; }
    await check(r.split('#')[0], url);
    // follow inlined/linked CSS for font and image URLs
    if (r.endsWith('.css')) for (const c of refs(await (await fetch(r)).text(), r)) await check(c, r);
  }
}
// a missing page must serve the custom 404 with a 404 status
const miss = await fetch(root + 'nao-existe/abc');
const body = await miss.text();
console.log(miss.status, root + 'nao-existe/abc', /Ops, essa página/.test(body) ? '(custom 404 page)' : '(NOT the custom 404)');
if (miss.status !== 404 || !/Ops, essa página/.test(body)) problems.push('custom 404 not served');
console.log(`checked ${seen.size} unique same-site URLs`);
console.log(problems.length ? 'PROBLEMS:\n' + problems.join('\n') : 'No 404s, no assets outside the base path.');
process.exit(problems.length ? 1 : 0);
