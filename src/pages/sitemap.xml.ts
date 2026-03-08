import { createAbsoluteSiteUrl } from '@/config/site';
import { listArtistProfiles, listNewsArticles, listReleaseCatalog } from '@/lib/catalog-data';

export async function GET() {
  const artists = await listArtistProfiles();
  const releases = await listReleaseCatalog();
  const news = await listNewsArticles();

  const staticPaths = ['/', '/about/', '/artists/', '/releases/', '/news/', '/shop/'];
  const artistPaths = artists.map((artist) => `/artists/${artist.data.slug}/`);
  const releasePaths = releases.map((release) => `/releases/${release.id}/`);
  const newsPaths = news.map((item) => `/news/${item.id}/`);

  const allPaths = [...staticPaths, ...artistPaths, ...releasePaths, ...newsPaths];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allPaths
    .map((path) => `  <url><loc>${createAbsoluteSiteUrl(path)}</loc></url>`)
    .join('\n')}\n</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
