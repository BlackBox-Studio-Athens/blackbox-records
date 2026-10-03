import { afterEach, expect, it, vi } from 'vitest';
import { contentSnapshotInput, loadContentSnapshot } from './content-loader';
import { readContentSnapshot } from './content-files/content-snapshot';

vi.mock('./content-files/content-snapshot', () => ({ readContentSnapshot: vi.fn(), snapshotCollection: vi.fn() }));

afterEach(() => vi.unstubAllEnvs());

it('never falls back to repository content when snapshot mode is incomplete', () => {
  vi.stubEnv('CMS_CONTENT_SOURCE', 'snapshot');
  vi.stubEnv('CMS_CONTENT_SNAPSHOT', '');
  vi.stubEnv('CMS_CONTENT_SHA256', '');
  vi.stubEnv('CMS_CONTENT_ENVIRONMENT', 'local');
  expect(() => contentSnapshotInput()).toThrow('Snapshot builds require');
});

it('shares a snapshot load by path, checksum and environment and retries rejected loads', async () => {
  const input = { path: '/snapshot.json', sha256: 'a'.repeat(64), environment: 'local' as const };
  const fixture = { snapshot: { records: [] }, media: new Map(), path: input.path } as unknown as Awaited<
    ReturnType<typeof readContentSnapshot>
  >;
  vi.mocked(readContentSnapshot).mockResolvedValue(fixture);
  const first = loadContentSnapshot(input);
  expect(loadContentSnapshot({ ...input })).toBe(first);
  await expect(first).resolves.toBe(fixture);
  expect(readContentSnapshot).toHaveBeenCalledTimes(1);
  await loadContentSnapshot({ ...input, sha256: 'b'.repeat(64) });
  await loadContentSnapshot({ ...input, environment: 'uat' });
  await loadContentSnapshot({ ...input, path: '/other.json' });
  expect(readContentSnapshot).toHaveBeenCalledTimes(4);
  vi.mocked(readContentSnapshot).mockRejectedValueOnce(new Error('Snapshot checksum mismatch.'));
  await expect(loadContentSnapshot(input)).rejects.toThrow('Snapshot checksum mismatch.');
  await expect(loadContentSnapshot(input)).resolves.toBe(fixture);
  expect(readContentSnapshot).toHaveBeenCalledTimes(6);
});
