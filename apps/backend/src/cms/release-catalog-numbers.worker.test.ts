import { afterEach, expect, test, vi } from 'vitest';
import {
  readReleaseCatalogNumbers,
  releaseCatalogNumberSaveError,
  releaseCatalogNumbersResponse,
} from './release-catalog-numbers';
import type { EmDashRuntime } from 'emdash/middleware';

afterEach(() => vi.restoreAllMocks());

function fixture() {
  const entries = [
    { id: 'one', slug: 'disintegration', data: {}, liveRevisionId: 'live-one', draftRevisionId: 'draft-one' },
    { id: 'two', slug: 'new', data: {}, liveRevisionId: null, draftRevisionId: 'draft-two' },
    { id: 'three', slug: 'unchanged', data: {}, liveRevisionId: 'live-three', draftRevisionId: 'live-three' },
    { id: 'empty', slug: 'empty', data: {}, liveRevisionId: null, draftRevisionId: null },
  ];
  const revisions = new Map([
    [
      'live-one',
      { entryId: 'one', collection: 'releases', data: { title: 'Disintegration', catalog_number: 'BBR#002' } },
    ],
    [
      'draft-one',
      {
        entryId: 'one',
        collection: 'releases',
        data: { title: 'Renamed', catalog_number: 'BBR#005', _slug: 'renamed' },
      },
    ],
    [
      'draft-two',
      { entryId: 'two', collection: 'releases', data: { title: 'New release', catalog_number: 'BBR#004' } },
    ],
    [
      'live-three',
      { entryId: 'three', collection: 'releases', data: { title: 'Unchanged', catalog_number: 'BBR#001' } },
    ],
  ]);
  const runtime = {
    handleContentList: vi.fn(async (_collection: string, options: { cursor?: string }) => ({
      success: true,
      data: {
        items: options.cursor ? entries.slice(2) : entries.slice(0, 2),
        nextCursor: options.cursor ? undefined : 'page2',
      },
    })),
    handleRevisionGet: vi.fn(async (id: string) => ({ success: true, data: { item: revisions.get(id) } })),
    handleContentGet: vi.fn(async (_collection: string, id: string) => ({
      success: true,
      data: { item: entries.find((entry) => entry.id === id || entry.slug === id)! },
    })),
  };
  return { runtime, revisions, typed: runtime as unknown as EmDashRuntime };
}

test('inventory follows every page and reserves distinct live and draft numbers once', async () => {
  const { runtime, typed } = fixture();
  expect(await readReleaseCatalogNumbers(typed)).toEqual({
    items: [
      {
        catalogNumber: 'BBR#002',
        releaseId: 'one',
        slug: 'disintegration',
        title: 'Disintegration',
        status: 'published',
      },
      { catalogNumber: 'BBR#005', releaseId: 'one', slug: 'renamed', title: 'Renamed', status: 'draft' },
      { catalogNumber: 'BBR#004', releaseId: 'two', slug: 'new', title: 'New release', status: 'draft' },
      { catalogNumber: 'BBR#001', releaseId: 'three', slug: 'unchanged', title: 'Unchanged', status: 'published' },
    ],
    nextFreeNumber: 'BBR#006',
  });
  expect(runtime.handleContentList).toHaveBeenNthCalledWith(2, 'releases', { limit: 100, cursor: 'page2' });
});

test.each(['BBR#002', 'BBR#005', 'BBR#004'])(
  'a clashing save of %s is a private field-scoped 422',
  async (catalog_number) => {
    const { typed } = fixture();
    const response = (await releaseCatalogNumberSaveError(typed, { catalog_number }))!;
    expect(response.status).toBe(422);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    const message = `${catalog_number} is already used by ${catalog_number === 'BBR#002' ? 'Disintegration' : catalog_number === 'BBR#005' ? 'Renamed' : 'New release'}.`;
    expect(await response.json()).toMatchObject({
      success: false,
      status: 422,
      code: 'invalid_editorial_save',
      fieldErrors: { catalog_number: message },
      error: { message: `catalog_number: ${message}` },
    });
  },
);

test.each(['one', 'disintegration'])('same-release saves resolve %s as id or slug', async (identity) => {
  const { typed } = fixture();
  expect(await releaseCatalogNumberSaveError(typed, { catalog_number: 'BBR#002' }, identity)).toBeNull();
  expect(await releaseCatalogNumberSaveError(typed, { catalog_number: 'BBR#005' }, identity)).toBeNull();
  expect(await releaseCatalogNumberSaveError(typed, { catalog_number: 'BBR#006' }, identity)).toBeNull();
});

test.each([undefined, null, ''])('incomplete number %s does not need an inventory read', async (catalog_number) => {
  const { typed, runtime } = fixture();
  expect(await releaseCatalogNumberSaveError(typed, { catalog_number })).toBeNull();
  expect(runtime.handleContentList).not.toHaveBeenCalled();
});

test('failed inventory or mismatched revisions cannot report availability', async () => {
  const { typed, runtime, revisions } = fixture();
  revisions.get('draft-two')!.entryId = 'someone-else';
  await expect(readReleaseCatalogNumbers(typed)).rejects.toThrow('unavailable');
  runtime.handleContentList.mockResolvedValueOnce({ success: false } as never);
  await expect(releaseCatalogNumberSaveError(typed, { catalog_number: 'BBR#007' })).rejects.toThrow('unavailable');
});

test('empty inventory starts at 001', async () => {
  const { typed, runtime } = fixture();
  runtime.handleContentList.mockResolvedValue({ success: true, data: { items: [] } } as never);
  expect(await readReleaseCatalogNumbers(typed)).toEqual({ items: [], nextFreeNumber: 'BBR#001' });
});

test('a numbered draft without a title is identified by its slug in save errors', async () => {
  const { typed, revisions } = fixture();
  revisions.get('draft-two')!.data.title = '';
  const response = (await releaseCatalogNumberSaveError(typed, { catalog_number: 'BBR#004' }))!;
  expect(await response.json()).toMatchObject({ fieldErrors: { catalog_number: 'BBR#004 is already used by new.' } });
});

test('catalog endpoint requires editorial staff GET and keeps all outcomes private', async () => {
  const read = vi.fn(async () => ({ items: [], nextFreeNumber: 'BBR#001' as never }));
  for (const [method, identity] of [
    ['GET', undefined],
    ['GET', { role: 10 }],
    ['POST', { role: 50 }],
  ] as const) {
    const response = await releaseCatalogNumbersResponse(
      new Request('https://staff.invalid/', { method }),
      identity,
      read,
    );
    expect(response.status).toBe(403);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  }
  expect(read).not.toHaveBeenCalled();
  const response = await releaseCatalogNumbersResponse(new Request('https://staff.invalid/'), { role: 30 }, read);
  expect(await response.json()).toEqual({ success: true, data: { items: [], nextFreeNumber: 'BBR#001' } });
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  read.mockRejectedValueOnce(new Error('private database detail'));
  const failed = await releaseCatalogNumbersResponse(new Request('https://staff.invalid/'), { role: 50 }, read);
  expect(failed.status).toBe(503);
  expect(failed.headers.get('Cache-Control')).toBe('private, no-store');
  expect(await failed.text()).not.toContain('private database detail');
});
