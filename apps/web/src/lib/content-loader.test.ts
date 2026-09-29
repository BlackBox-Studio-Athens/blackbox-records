import { afterEach, expect, it, vi } from 'vitest';
import { contentSnapshotInput } from './content-loader';

afterEach(() => vi.unstubAllEnvs());

it('never falls back to repository content when snapshot mode is incomplete', () => {
  vi.stubEnv('CMS_CONTENT_SOURCE', 'snapshot');
  vi.stubEnv('CMS_CONTENT_SNAPSHOT', '');
  vi.stubEnv('CMS_CONTENT_SHA256', '');
  vi.stubEnv('CMS_CONTENT_ENVIRONMENT', 'local');
  expect(() => contentSnapshotInput()).toThrow('Snapshot builds require');
});
