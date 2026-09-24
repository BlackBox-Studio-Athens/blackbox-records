import { beforeEach, expect, it, vi } from 'vitest';

vi.mock('./backend/editorial-api', () => ({ editorialRequest: vi.fn() }));

import { editorialRequest } from './backend/editorial-api';
import { readReviewChangesPresence } from './review-changes';

const request = vi.mocked(editorialRequest);

beforeEach(() => request.mockReset());

it('follows sparse global pages and stops at the first change', async () => {
  request
    .mockResolvedValueOnce({ items: [], nextCursor: 'sparse-page' } as never)
    .mockResolvedValueOnce({ items: [{ id: 'changed' }], nextCursor: 'later-page' } as never);

  await expect(readReviewChangesPresence('https://staff.invalid')).resolves.toBe(true);
  expect(request).toHaveBeenCalledTimes(2);
  expect(request).toHaveBeenNthCalledWith(
    1,
    'https://staff.invalid',
    'blackbox/workspace?view=changes&scope=all&limit=25',
  );
  expect(request).toHaveBeenNthCalledWith(
    2,
    'https://staff.invalid',
    'blackbox/workspace?view=changes&scope=all&limit=25&cursor=sparse-page',
  );
});

it('reports empty only after every sparse continuation is exhausted', async () => {
  request
    .mockResolvedValueOnce({ items: [], nextCursor: 'sparse-page' } as never)
    .mockResolvedValueOnce({ items: [] } as never);

  await expect(readReviewChangesPresence('https://staff.invalid')).resolves.toBe(false);
  expect(request).toHaveBeenCalledTimes(2);
});
