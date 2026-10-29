import { env } from 'cloudflare:test';
import { expect, test } from 'vitest';
import { ContentRepository } from 'emdash';
import { createRequestScopedDb } from '@emdash-cms/cloudflare/db/d1';
import { getPublicationProductConditionIssues } from '@blackbox/content-model';

test('native partial updates require explicit null to clear a saved physical condition', async () => {
  await env.TEST_CMS_DB.prepare(
    `CREATE TABLE ec_condition_clear (
    id TEXT PRIMARY KEY, slug TEXT, status TEXT, version INTEGER DEFAULT 1,
    deleted_at TEXT, updated_at TEXT, product_condition TEXT, title TEXT
  )`,
  ).run();
  await env.TEST_CMS_DB.prepare(
    "INSERT INTO ec_condition_clear (id, slug, status, product_condition, title) VALUES ('record', 'record', 'draft', 'used', 'Private title')",
  ).run();
  const scoped = createRequestScopedDb({
    config: { binding: 'TEST_CMS_DB', session: 'primary-first' },
    isAuthenticated: true,
    isWrite: true,
    cookies: { get: () => undefined, set: () => undefined },
    url: new URL('http://localhost'),
  });
  expect(scoped).not.toBeNull();
  if (!scoped) throw new Error('Native D1 adapter unavailable');
  const contexts = new Map([
    [
      'condition_clear',
      Promise.resolve({
        timezone: 'UTC',
        fields: [],
        urlFields: [],
        writableFieldSlugs: new Set(['product_condition', 'title']),
      }),
    ],
  ]);
  const repository = new ContentRepository(scoped.db, contexts);
  try {
    await repository.update('condition_clear', 'record', { data: {} });
    expect((await repository.findById('condition_clear', 'record'))!.data.product_condition).toBe('used');
    await repository.update('condition_clear', 'record', { data: { product_condition: null } });
    expect(
      await env.TEST_CMS_DB.prepare('SELECT product_condition, title FROM ec_condition_clear WHERE id = ?')
        .bind('record')
        .first(),
    ).toEqual({ product_condition: null, title: 'Private title' });
    const reopened = await new ContentRepository(scoped.db, contexts).findById('condition_clear', 'record');
    expect(reopened!.data).toEqual({ title: 'Private title' });
    expect(getPublicationProductConditionIssues('distro', reopened!.data)).toHaveLength(1);
  } finally {
    await env.TEST_CMS_DB.prepare('DROP TABLE ec_condition_clear').run();
    await scoped.db.destroy();
  }
});
