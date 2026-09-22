import { expect, test } from 'vitest';
import { ownedPreviewContext, retainPreviewContext, type RetainedPreview } from '../../src/cms/preview-contexts';

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
