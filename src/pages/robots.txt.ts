import type { APIRoute } from 'astro';
import { withBase } from '../lib/url';

// Static at build time. NOTE: crawlers only read robots.txt at a domain's ROOT; under a project-site subfolder it is
// informational. Submit the sitemap in Google Search Console instead (see README).
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *
Allow: /

Sitemap: ${new URL(withBase('sitemap-index.xml'), site).href}
`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
