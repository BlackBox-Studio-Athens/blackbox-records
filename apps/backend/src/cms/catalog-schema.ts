import { SchemaRegistry } from 'emdash';
import { scalarProseFields } from '@blackbox/content-model';
import type { EmDashRuntime } from 'emdash/middleware';

// Explicit setup operation, never run as a side effect of browsing.
export async function prepareCatalogSchema(runtime: EmDashRuntime) {
  const registry = new SchemaRegistry(runtime.db);
  const footerText = await registry.getField('settings', 'footer_text');
  if (!footerText)
    await registry.createField('settings', {
      slug: 'footer_text',
      label: 'Footer text',
      type: 'string',
      required: false,
    });
  else if (footerText.type !== 'string') throw new Error('Unexpected field type: settings.footer_text');
  const artistActivity = await registry.getField('artists', 'is_active');
  if (!artistActivity)
    await registry.createField('artists', {
      slug: 'is_active',
      label: 'Active artist',
      type: 'boolean',
      required: false,
    });
  else if (artistActivity.type !== 'boolean') throw new Error('Unexpected field type: artists.is_active');
  const newsArtist = await registry.getField('news', 'artist');
  if (!newsArtist)
    await registry.createField('news', {
      slug: 'artist',
      label: 'Artist',
      type: 'reference',
      required: false,
      options: { collection: 'artists' },
    });
  else if (newsArtist.type !== 'reference' || newsArtist.options?.collection !== 'artists')
    throw new Error('Unexpected field type: news.artist');
  const releaseStage = await registry.getField('releases', 'release_stage');
  if (!releaseStage)
    await registry.createField('releases', {
      slug: 'release_stage',
      label: 'Release stage',
      type: 'string',
      required: false,
    });
  else if (releaseStage.type !== 'string') throw new Error('Unexpected field type: releases.release_stage');
  const releasePriority = await registry.getField('releases', 'releases_priority');
  if (!releasePriority)
    await registry.createField('releases', {
      slug: 'releases_priority',
      label: 'Releases order',
      type: 'number',
      required: false,
    });
  else if (releasePriority.type !== 'number') throw new Error('Unexpected field type: releases.releases_priority');
  for (const [collection, fields] of Object.entries(scalarProseFields)) {
    for (const field of fields) {
      const slug = `${field}_rich`;
      const existing = await registry.getField(collection, slug);
      if (!existing)
        await registry.createField(collection, { slug, label: field, type: 'portableText', required: false });
      else if (existing.type !== 'portableText') throw new Error(`Unexpected field type: ${collection}.${slug}`);
    }
  }
  for (const collection of ['releases', 'distro']) {
    const existing = await registry.getField(collection, 'tracklist');
    if (!existing)
      await registry.createField(collection, { slug: 'tracklist', label: 'Tracklist', type: 'json', required: false });
    else if (existing.type !== 'json') throw new Error(`Unexpected field type: ${collection}.tracklist`);
  }
  for (const slug of ['singles', 'clips', 'partner_links']) {
    const existing = await registry.getField('releases', slug);
    if (!existing) await registry.createField('releases', { slug, label: slug, type: 'json', required: false });
    else if (existing.type !== 'json') throw new Error(`Unexpected field type: releases.${slug}`);
  }
  for (const slug of ['bandcamp_embed_url', 'tidal_url']) {
    const existing = await registry.getField('distro', slug);
    if (!existing)
      await registry.createField('distro', {
        slug,
        label: slug === 'bandcamp_embed_url' ? 'Bandcamp embed URL' : 'Tidal URL',
        type: 'url',
        required: false,
      });
    else if (existing.type !== 'url') throw new Error(`Unexpected field type: distro.${slug}`);
  }
  const group = await registry.getField('distro', 'group');
  if (group && !group.indexed) await registry.updateField('distro', 'group', { indexed: true });
  for (const slug of ['artists', 'releases', 'distro', 'news']) {
    const collection = await registry.getCollection(slug);
    if (collection && collection.titleField !== 'title') await registry.updateCollection(slug, { titleField: 'title' });
  }
  return Response.json({ success: true }, { headers: { 'Cache-Control': 'private, no-store' } });
}
