import { env } from 'cloudflare:test';
import { createRequestScopedDb } from '@emdash-cms/cloudflare/db/d1';
import { SchemaRegistry } from 'emdash';
import { runMigrations } from 'emdash/db';
import { expect, test } from 'vitest';
import { migrateTypedValues } from './typed-values-migration';

test('stages typed drafts once, reports unknown countries and preserves saved revisions', async () => {
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
    for (const slug of ['artists', 'releases', 'distro', 'navigation', 'socials', 'services']) {
      await registry.createCollection({ slug, label: slug, routable: false, supports: ['drafts', 'revisions'] });
      await registry.createField(slug, { slug: 'title', label: 'Title', type: 'string' });
    }
    await registry.createField('artists', { slug: 'country', label: 'Country', type: 'json' });
    await registry.createField('distro', { slug: 'format', label: 'Format', type: 'string' });
    await registry.createField('distro', { slug: 'format_override', label: 'Override', type: 'string' });
    await registry.createField('socials', { slug: 'visible', label: 'Visible', type: 'boolean' });
    await env.TEST_CMS_DB.prepare(
      "INSERT INTO ec_artists (id, slug, title, country) VALUES ('good', 'good', 'Good', 'Greece'), ('bad', 'bad', 'Bad', 'Unknown place')",
    ).run();
    await env.TEST_CMS_DB.prepare("INSERT INTO revisions (id, collection, entry_id, data) VALUES (?, 'artists', ?, ?)")
      .bind('live-good', 'good', JSON.stringify({ title: 'Good', country: 'Greece' }))
      .run();
    await env.TEST_CMS_DB.prepare("INSERT INTO revisions (id, collection, entry_id, data) VALUES (?, 'artists', ?, ?)")
      .bind('live-bad', 'bad', JSON.stringify({ title: 'Bad', country: 'Unknown place' }))
      .run();
    await env.TEST_CMS_DB.prepare(
      "UPDATE ec_artists SET live_revision_id = CASE id WHEN 'good' THEN 'live-good' ELSE 'live-bad' END",
    ).run();
    const before = (await env.TEST_CMS_DB.prepare('SELECT id, data FROM revisions ORDER BY id').all()).results;
    const first = await migrateTypedValues(scoped.db, true);
    expect(first.drafts).toEqual([{ collection: 'artists', slug: 'good', id: 'good' }]);
    expect(first.problems).toEqual([{ collection: 'artists', slug: 'bad', field: 'country' }]);
    const good = await env.TEST_CMS_DB.prepare(
      "SELECT live_revision_id, draft_revision_id FROM ec_artists WHERE id = 'good'",
    ).first<{ live_revision_id: string; draft_revision_id: string }>();
    expect(good?.live_revision_id).toBe('live-good');
    expect(good?.draft_revision_id).toBeTruthy();
    const draft = await env.TEST_CMS_DB.prepare('SELECT data FROM revisions WHERE id = ?')
      .bind(good!.draft_revision_id)
      .first<{ data: string }>();
    expect(JSON.parse(draft!.data)).toEqual({ title: 'Good', country: ['GR'] });
    expect(
      (
        await env.TEST_CMS_DB.prepare(
          "SELECT id, data FROM revisions WHERE id IN ('live-good', 'live-bad') ORDER BY id",
        ).all()
      ).results,
    ).toEqual(before);
    expect(
      await env.TEST_CMS_DB.prepare("SELECT draft_revision_id FROM ec_artists WHERE id = 'bad'").first(
        'draft_revision_id',
      ),
    ).toBeNull();
    const repeat = await migrateTypedValues(scoped.db, true);
    expect(repeat.drafts).toEqual([]);
    expect(repeat.problems).toEqual(first.problems);
  } finally {
    await scoped.db.destroy();
  }
}, 60_000);
