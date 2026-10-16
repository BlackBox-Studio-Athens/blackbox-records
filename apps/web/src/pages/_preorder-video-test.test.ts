import { expect, it, vi } from 'vitest';
import { preorderVideoTestItems } from './_preorder-video-test';

vi.mock('astro:config/client', () => ({ base: '/blackbox-records/', site: undefined }));

it('mirrors the two PRD film chapters with local footage and UAT-only navigation', () => {
  const items = preorderVideoTestItems();
  expect(items.map((item) => item.title)).toEqual(['LOTUS', 'Disintegration']);
  expect(new Set(items.map((item) => item.slug)).size).toBe(2);
  for (const item of items) {
    expect(item.storePath).toBe('/blackbox-records/store/');
    expect(item.artistPath).toMatch(/^\/blackbox-records\/artists\//);
    expect(item.clips).toHaveLength(1);
    expect(item.clips![0]!.backgroundVideoUrl).toMatch(/\.mp4$/);
    expect(item.clips![0]!.backgroundVideoDesktopUrl).toMatch(/-desktop\.mp4$/);
    expect(item.clips![0]!.posterUrl).toMatch(/\.jpg$/);
    expect(item.listen?.releaseId).toBe(item.slug);
    expect(item.coverUrl).toMatch(
      /^https:\/\/images\.blackboxrecordsathens\.com\/cdn-cgi\/image\/width=720,format=webp\//,
    );
  }
});
