import { expect, test, vi } from 'vitest';
import plugin from './editorial-plugin';

test('artist and release discard permits only never-published drafts and never permanent deletion', async () => {
  const beforeDelete = plugin.hooks['content:beforeDelete'];
  for (const collection of ['artists', 'releases']) {
    const event = { collection, id: 'draft', permanent: false };
    const get = vi.fn().mockResolvedValue({ status: 'draft', liveRevisionId: null, publishedAt: null });
    const context = { content: { get } } as unknown as Parameters<typeof beforeDelete>[1];
    expect(await beforeDelete(event, context)).toBe(true);
    expect(await beforeDelete({ ...event, permanent: true }, context)).toBe(false);
    for (const item of [
      null,
      { status: 'published' },
      { status: 'draft', liveRevisionId: 'live' },
      { status: 'draft', publishedAt: '2026-09-01' },
    ]) {
      get.mockResolvedValue(item);
      expect(await beforeDelete(event, context)).toBe(false);
    }
  }
});
