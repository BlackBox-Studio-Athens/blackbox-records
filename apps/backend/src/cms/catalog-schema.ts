import { SchemaRegistry } from 'emdash';
import { scalarProseFields } from '@blackbox/content-model';
import type { EmDashRuntime } from 'emdash/middleware';

// Explicit setup operation, never run as a side effect of browsing.
export async function prepareCatalogSchema(runtime: EmDashRuntime) {
  const registry = new SchemaRegistry(runtime.db);
  if (!(await registry.getCollection('shows')))
    await registry.createCollection({
      slug: 'shows',
      label: 'shows',
      routable: false,
      supports: ['drafts', 'revisions', 'preview'],
    });
  for (const [slug, type] of [
    ['title', 'string'],
    ['date', 'string'],
    ['doors', 'string'],
    ['venue', 'string'],
    ['prices', 'json'],
    ['ticket_url', 'string'],
    ['facebook_url', 'string'],
    ['billing', 'string'],
    ['poster', 'image'],
    ['poster_alt', 'string'],
    ['lineup', 'json'],
  ] as const) {
    const existing = await registry.getField('shows', slug);
    if (!existing) await registry.createField('shows', { slug, label: slug, type, required: false });
    else if (existing.type !== type) throw new Error(`Unexpected field type: shows.${slug}`);
  }
  const catalogNumber = await registry.getField('releases', 'catalog_number');
  if (!catalogNumber)
    await registry.createField('releases', {
      slug: 'catalog_number',
      label: 'Catalog number',
      type: 'string',
      required: false,
    });
  else if (catalogNumber.type !== 'string') throw new Error('Unexpected field type: releases.catalog_number');
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
  const showOnHome = await registry.getField('releases', 'show_on_home');
  if (!showOnHome)
    await registry.createField('releases', {
      slug: 'show_on_home',
      label: 'Show on Home',
      type: 'boolean',
      required: false,
    });
  else if (showOnHome.type !== 'boolean') throw new Error('Unexpected field type: releases.show_on_home');
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
    const condition = await registry.getField(collection, 'product_condition');
    if (!condition)
      await registry.createField(collection, {
        slug: 'product_condition',
        label: 'Product condition',
        type: 'string',
        required: false,
      });
    else if (condition.type !== 'string') throw new Error(`Unexpected field type: ${collection}.product_condition`);
    const safety = await registry.getField(collection, 'product_safety');
    if (!safety)
      await registry.createField(collection, {
        slug: 'product_safety',
        label: 'Product safety',
        type: 'json',
        required: false,
      });
    else if (safety.type !== 'json') throw new Error(`Unexpected field type: ${collection}.product_safety`);
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
  const distroFormat = await registry.getField('distro', 'format');
  if (!distroFormat)
    await registry.createField('distro', {
      slug: 'format',
      label: 'Format',
      type: 'string',
      required: false,
      indexed: true,
    });
  else if (distroFormat.type !== 'string') throw new Error('Unexpected field type: distro.format');
  else if (!distroFormat.indexed) await registry.updateField('distro', 'format', { indexed: true });
  const override = await registry.getField('distro', 'format_override');
  if (!override)
    await registry.createField('distro', {
      slug: 'format_override',
      label: 'Format display override',
      type: 'string',
      required: false,
    });
  else if (override.type !== 'string') throw new Error('Unexpected field type: distro.format_override');
  const countries = await registry.getField('artists', 'country');
  if (!countries)
    await registry.createField('artists', { slug: 'country', label: 'Countries', type: 'json', required: false });
  else if (countries.type === 'string' && countries.columnType.toUpperCase() === 'TEXT')
    await runtime.db
      .updateTable('_emdash_fields')
      .set({ type: 'json' })
      .where('id', '=', countries.id)
      .where('type', '=', 'string')
      .execute();
  else if (countries.type !== 'json') throw new Error('Unexpected field type: artists.country');
  if (await registry.getCollection('socials')) {
    const visible = await registry.getField('socials', 'visible');
    if (!visible)
      await registry.createField('socials', { slug: 'visible', label: 'Visible', type: 'boolean', required: false });
    else if (visible.type !== 'boolean') throw new Error('Unexpected field type: socials.visible');
  }
  for (const slug of ['artists', 'releases', 'distro', 'news', 'shows']) {
    const collection = await registry.getCollection(slug);
    if (collection && collection.titleField !== 'title') await registry.updateCollection(slug, { titleField: 'title' });
  }
  return Response.json({ success: true }, { headers: { 'Cache-Control': 'private, no-store' } });
}
