import { createAbsoluteSiteUrl } from '@/platform/config/site';

export const prerender = true;

export function GET() {
  const sitemapUrl = createAbsoluteSiteUrl('/sitemap.xml');
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
