import { env } from 'cloudflare:test';
import { expect, test } from 'vitest';
import { ContentRepository } from 'emdash';
import { createRequestScopedDb } from '@emdash-cms/cloudflare/db/d1';
import { storeClearedDistroGroup } from './distro-legacy-group';

test('a Distro draft that clears the legacy group publishes into the NOT NULL column', async () => {
  const db = env.TEST_CMS_DB;
  await db.batch([
    db.prepare(
      `CREATE TABLE ec_distro (
      id TEXT PRIMARY KEY, slug TEXT, status TEXT, version INTEGER DEFAULT 1, locale TEXT, translation_group TEXT,
      deleted_at TEXT, created_at TEXT, updated_at TEXT, published_at TEXT, scheduled_at TEXT,
      live_revision_id TEXT, draft_revision_id TEXT, title TEXT NOT NULL DEFAULT '', "group" TEXT NOT NULL DEFAULT ''
    )`,
    ),
    db.prepare(
      'CREATE TABLE revisions (id TEXT PRIMARY KEY, collection TEXT, entry_id TEXT, data TEXT, author_id TEXT, created_at TEXT)',
    ),
    db.prepare(
      `INSERT INTO revisions (id, collection, entry_id, data, created_at)
      VALUES ('draft', 'distro', 'record', '{"title":"New title","group":null}', '2026-11-26T09:35:24.000Z')`,
    ),
    db.prepare(
      `INSERT INTO ec_distro (id, slug, status, updated_at, draft_revision_id, title, "group")
      VALUES ('record', 'record', 'published', '2026-11-25T18:15:35.195Z', 'draft', 'Old title', '')`,
    ),
  ]);
  const scoped = createRequestScopedDb({
    config: { binding: 'TEST_CMS_DB', session: 'primary-first' },
    isAuthenticated: true,
    isWrite: true,
    cookies: { get: () => undefined, set: () => undefined },
    url: new URL('http://localhost'),
  });
  if (!scoped) throw new Error('Native D1 adapter unavailable');
  const contexts = new Map([
    [
      'distro',
      Promise.resolve({ timezone: 'UTC', fields: [], urlFields: [], writableFieldSlugs: new Set(['title', 'group']) }),
    ],
  ]);
  const publish = () => new ContentRepository(scoped.db, contexts).publish('distro', 'record');
  try {
    await expect(publish()).rejects.toThrow(/NOT NULL constraint failed: ec_distro.group/);
    await storeClearedDistroGroup(db, 'record');
    await publish();
    expect(await db.prepare('SELECT title, "group", live_revision_id FROM ec_distro').first()).toEqual({
      title: 'New title',
      group: '',
      live_revision_id: 'draft',
    });
  } finally {
    await db.batch([db.prepare('DROP TABLE ec_distro'), db.prepare('DROP TABLE revisions')]);
    await scoped.db.destroy();
  }
});
