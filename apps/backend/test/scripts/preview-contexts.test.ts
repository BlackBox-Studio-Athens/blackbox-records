import { expect, test } from 'vitest';
import {
  ownedPreviewContext,
  releasePreviewContext,
  retainPreviewContext,
  type PreviewContextStorage,
  type RetainedPreview,
} from '../../src/cms/preview-contexts';

function createStorage(): PreviewContextStorage {
  const values = new Map<string, unknown>();
  return {
    get: (key) => values.get(key),
    put: (key, value) => {
      values.set(key, value);
    },
    delete: (key) => values.delete(key),
    list: ({ prefix }) => [...values.entries()].filter(([key]) => key.startsWith(prefix)),
  };
}

test('contexts require ownership, expire, enforce capacity and retain independent input', () => {
  const contexts = new Map<string, RetainedPreview>();
  const input = {
    owner: 'editor@example.com',
    parentOrigin: 'http://127.0.0.1:8787',
    generation: 1,
    selection: {
      content: { records: [], media: [] },
      input: { collection: 'news' as const, slug: 'draft', data: { title: 'Draft' } },
      media: {},
    },
  };
  const id = retainPreviewContext(contexts, input, 0);
  input.selection.input.data.title = 'Later edit';
  expect(ownedPreviewContext(contexts, id, input.owner, 1).selection.input.data.title).toBe('Draft');
  expect(() => ownedPreviewContext(contexts, id, 'other@example.com', 1)).toThrow('unavailable');
  for (let i = 1; i < 16; i++) retainPreviewContext(contexts, input, 1);
  expect(() => retainPreviewContext(contexts, input, 2)).toThrow('capacity');
  expect(() => ownedPreviewContext(contexts, id, input.owner, 900_000)).toThrow('expired');
  expect(() => retainPreviewContext(contexts, input, 900_002)).not.toThrow();
  expect(contexts.size).toBe(1);
  expect(() =>
    retainPreviewContext(
      contexts,
      {
        ...input,
        selection: {
          ...input.selection,
          input: { ...input.selection.input, data: { title: 'x'.repeat(8 * 1024 * 1024) } },
        },
      },
      900_003,
    ),
  ).toThrow('capacity');
});

test('preview context survives object memory loss, restores chunked data and expires from storage', () => {
  const storage = createStorage();
  const owner = 'editor@example.com';
  const input = {
    owner,
    parentOrigin: 'http://127.0.0.1:8787',
    generation: 2,
    requestId: '61702d60-d2c0-4880-8f6d-6f288b6a99fd',
    selection: {
      content: { records: [], media: [] },
      input: { collection: 'distro' as const, slug: 'draft', data: { title: 'x'.repeat(1_100_000) } },
      media: {},
    },
  };
  const id = retainPreviewContext(new Map(), input, 0, storage);
  expect(id).toBe(input.requestId);

  const afterEviction = new Map<string, RetainedPreview>();
  const restored = ownedPreviewContext(afterEviction, id, owner, 1, storage);
  expect(restored.selection.input.data.title).toHaveLength(1_100_000);
  expect(afterEviction.size).toBe(1);

  releasePreviewContext(afterEviction, id, storage);
  expect([...storage.list({ prefix: 'cms-preview:v1:manifest:' })]).toHaveLength(0);

  const expiredId = retainPreviewContext(new Map(), input, 0, storage);
  expect(() => ownedPreviewContext(new Map(), expiredId, owner, 900_000, storage)).toThrow('expired');
  expect([...storage.list({ prefix: 'cms-preview:v1:manifest:' })]).toHaveLength(0);
});
