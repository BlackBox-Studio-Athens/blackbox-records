import { createAbsoluteSiteUrl } from '@/config/site';
import { getReleaseDetailSlug, listArtistProfiles, listNewsArticles, listReleaseCatalog } from '@/lib/catalog-data';
import { getDiscoverableStoreCatalogCategories } from '@/lib/store-categories';
import { listStoreCollectionEntries } from '@/lib/store-collection';

export async function GET() {
  const [artists, releases, news, storeEntries] = await Promise.all([
    listArtistProfiles(),
    listReleaseCatalog(),
    listNewsArticles(),
    listStoreCollectionEntries(),
  ]);
  const storeCategories = getDiscoverableStoreCatalogCategories([
    'all',
    ...storeEntries.flatMap((entry) => entry.categoryIds),
  ]);

  const staticPaths = [
    '/',
    '/about/',
    '/artists/',
    '/releases/',
    '/news/',
    '/services/',
    ...storeCategories.map((category) => category.path),
  ];
  const artistPaths = artists.map((artist) => `/artists/${artist.data.slug}/`);
  const releasePaths = releases.map((release) => `/releases/${getReleaseDetailSlug(release)}/`);
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
