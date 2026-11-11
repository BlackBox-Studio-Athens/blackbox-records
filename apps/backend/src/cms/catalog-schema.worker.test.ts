import { env } from 'cloudflare:test';
import { createRequestScopedDb } from '@emdash-cms/cloudflare/db/d1';
import { ContentRepository, SchemaRegistry } from 'emdash';
import { runMigrations } from 'emdash/db';
import type { EmDashRuntime } from 'emdash/middleware';
import { expect, test } from 'vitest';
import { prepareCatalogSchema } from './catalog-schema';
import plugin from './editorial-plugin';

test('Show schema preparation creates missing fields, preserves content, repeats, and rejects wrong types', async () => {
  const scoped = createRequestScopedDb({
    config: { binding: 'TEST_CMS_DB', session: 'primary-first' },
    isAuthenticated: true,
    isWrite: true,
    cookies: { get: () => undefined, set: () => undefined },
    url: new URL('http://localhost'),
  });
  if (!scoped) throw new Error('Native D1 adapter unavailable');
  try {
    await runMigrations(scoped.db);
    const registry = new SchemaRegistry(scoped.db);
    for (const slug of ['artists', 'releases', 'distro', 'news', 'settings', 'newsletter', 'socials'])
      await registry.createCollection({ slug, label: slug, routable: false });
    for (const slug of ['artists', 'releases', 'distro', 'news'])
      await registry.createField(slug, { slug: 'title', label: 'Title', type: 'string' });
    await registry.createField('artists', { slug: 'country', label: 'Country', type: 'string' });
    await env.TEST_CMS_DB.prepare(
      "INSERT INTO ec_artists (id, slug, title, country) VALUES ('existing', 'existing', 'Keep me', 'Greece')",
    ).run();
    const content = async () =>
      (
        await env.TEST_CMS_DB.prepare(
          'SELECT id, slug, status, title, country, created_at, updated_at FROM ec_artists',
        ).all()
      ).results;
    const before = await content();
    const runtime = { db: scoped.db } as EmDashRuntime;
    expect((await prepareCatalogSchema(runtime)).status).toBe(200);
    expect((await registry.getField('artists', 'country'))?.type).toBe('json');
    expect((await registry.getField('socials', 'visible'))?.type).toBe('boolean');
    const fields = await registry.listFields((await registry.getCollection('shows'))!.id);
    expect(Object.fromEntries(fields.map((field) => [field.slug, field.type]))).toEqual({
      title: 'string',
      date: 'string',
      doors: 'string',
      venue: 'string',
      prices: 'json',
      ticket_url: 'string',
      facebook_url: 'string',
      billing: 'string',
      poster: 'image',
      poster_alt: 'string',
      lineup: 'json',
    });
    expect(await content()).toEqual(before);
    await env.TEST_CMS_DB.prepare(
      "INSERT INTO ec_shows (id, slug, title) VALUES ('draft-show', 'draft-show', 'Draft')",
    ).run();
    const repository = new ContentRepository(scoped.db);
    const beforeDelete = plugin.hooks['content:beforeDelete'];
    const context = {
      content: { get: (collection: string, id: string) => repository.findById(collection, id) },
    } as unknown as Parameters<typeof beforeDelete>[1];
    expect(await beforeDelete({ collection: 'shows', id: 'draft-show', permanent: false }, context)).toBe(true);
    expect(await repository.delete('shows', 'draft-show')).toBe(true);
    expect(await repository.findById('shows', 'draft-show')).toBeNull();
    expect(
      await env.TEST_CMS_DB.prepare("SELECT deleted_at FROM ec_shows WHERE id = 'draft-show'").first('deleted_at'),
    ).toBeTruthy();
    const metadata = (await env.TEST_CMS_DB.prepare('SELECT * FROM _emdash_fields ORDER BY id').all()).results;
    const collections = (await env.TEST_CMS_DB.prepare('SELECT * FROM _emdash_collections ORDER BY id').all()).results;
    expect((await prepareCatalogSchema(runtime)).status).toBe(200);
    expect((await env.TEST_CMS_DB.prepare('SELECT * FROM _emdash_fields ORDER BY id').all()).results).toEqual(metadata);
    expect((await env.TEST_CMS_DB.prepare('SELECT * FROM _emdash_collections ORDER BY id').all()).results).toEqual(
      collections,
    );
    expect(await content()).toEqual(before);
    const doors = fields.find((field) => field.slug === 'doors')!;
    await env.TEST_CMS_DB.prepare("UPDATE _emdash_fields SET type = 'number' WHERE id = ?").bind(doors.id).run();
    await expect(prepareCatalogSchema(runtime)).rejects.toThrow('Unexpected field type: shows.doors');
    expect((await registry.getField('shows', 'doors'))?.type).toBe('number');
    expect(await content()).toEqual(before);
  } finally {
    await scoped.db.destroy();
  }
}, 60_000);
