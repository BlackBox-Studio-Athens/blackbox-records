import { getCollection } from 'astro:content';

import { siteConfig } from '@/config/site';

function createAbsoluteUrl(path: string) {
  const base = siteConfig.basePath.replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${siteConfig.origin}${base}${normalized}`;
}

export async function GET() {
  const artists = await getCollection('artists');
  const releases = await getCollection('releases');
  const news = await getCollection('news');

  const staticPaths = ['/', '/about/', '/artists/', '/releases/', '/news/', '/shop/'];
  const artistPaths = artists.map((artist) => `/artists/${artist.data.slug}/`);
  const releasePaths = releases.map((release) => `/releases/${release.id}/`);
  const newsPaths = news.map((item) => `/news/${item.id}/`);

  const allPaths = [...staticPaths, ...artistPaths, ...releasePaths, ...newsPaths];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allPaths
    .map((path) => `  <url><loc>${createAbsoluteUrl(path)}</loc></url>`)
    .join('\n')}\n</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
