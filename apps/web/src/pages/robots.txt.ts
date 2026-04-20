import { createAbsoluteSiteUrl } from '@/config/site';

export function GET() {
  const sitemapUrl = createAbsoluteSiteUrl('/sitemap.xml');
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
