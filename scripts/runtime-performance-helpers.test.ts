import { describe, expect, it } from 'vitest';

import {
  assertTraversalSetup,
  countStoreActivationRequests,
  dynamicImportSpecifiers,
  extractStoreActivationMilestones,
  storeActivationRejectionReasons,
  summarizeStoreActivationRuns,
  summarizeTrace,
  type TraceEvent,
} from './runtime-performance-helpers';

describe('runtime performance helpers', () => {
  it('rejects missing readiness and incomplete expanded traversal setup', () => {
    expect(() => assertTraversalSetup([], false)).toThrow();
    expect(() => assertTraversalSetup([{ ready: false, mode: 'preview', cardCount: 6 }], false)).toThrow();
    expect(() => assertTraversalSetup([{ ready: true, mode: 'preview', cardCount: 6 }], true)).toThrow();
    expect(() => assertTraversalSetup([{ ready: true, mode: 'catalog', cardCount: 6 }], true)).not.toThrow();
  });

  it('preserves a long individual slice even when windowed p95 passes', () => {
    const result = summarizeTrace([
      { name: 'thread_name', pid: 1, tid: 1, args: { name: 'CrRendererMain' } },
      { name: 'RunTask', pid: 1, tid: 1, ts: 0, dur: 270_000 },
      { name: 'Layout', pid: 1, tid: 1, ts: 0, dur: 265_000 },
      { name: 'Paint', pid: 1, tid: 1, ts: 10_000_000, dur: 100 },
    ]);
    expect(result.mainStyleLayoutPaint.p95).toBeLessThan(8);
    expect(result.layout.maximum).toBe(265);
    expect(result.tasks.maximum).toBe(270);
    expect(result.longTaskCount).toBe(1);
  });
  it('reads Vite template-literal dynamic imports', () => {
    expect(dynamicImportSpecifiers('import(`./store-cart.A1b2.js`); import("./drawer.C3d4.js")')).toEqual([
      './store-cart.A1b2.js',
      './drawer.C3d4.js',
    ]);
  });

  it('keeps target renderer work once and excludes other threads', () => {
    const events: TraceEvent[] = [
      { name: 'thread_name', pid: 1, tid: 10, args: { name: 'CrRendererMain' } },
      { name: 'thread_name', pid: 2, tid: 20, args: { name: 'CrRendererMain' } },
      { name: 'RunTask', pid: 1, tid: 10, ts: 0, dur: 40_000 },
      { name: 'EvaluateScript', pid: 1, tid: 10, ts: 1_000, dur: 10_000 },
      { name: 'FunctionCall', pid: 1, tid: 10, ts: 2_000, dur: 5_000 },
      { name: 'Layout', pid: 1, tid: 10, ts: 9_000, dur: 4_000 },
      { name: 'RunTask', pid: 2, tid: 20, ts: 0, dur: 5_000 },
      { name: 'Layout', pid: 2, tid: 20, ts: 0, dur: 100_000 },
    ];

    const result = summarizeTrace(events);

    expect(result.script.total).toBe(10);
    expect(result.layout.total).toBe(4);
    expect(result.mainStyleLayoutPaint.total).toBe(12);
    expect(result.taskCount).toBe(1);
  });

  it('extracts and summarizes Store activation milestones', () => {
    const first = extractStoreActivationMilestones({
      clickAt: 100,
      pricesSettledAt: 500,
      storeContentAt: 300,
      veilClosedAt: 450,
    });
    const second = { ...first, clickToPricesSettledMs: 300, rejectionReasons: [] };

    expect(first).toEqual({
      clickToPricesSettledMs: 400,
      clickToStoreContentMs: 200,
      clickToVeilClosedMs: 350,
    });
    expect(summarizeStoreActivationRuns([{ ...first, rejectionReasons: [] }, second])).toMatchObject({
      acceptedRuns: 2,
      clickToPricesSettledMs: { median: 300, p75: 400 },
      rejectedRuns: 0,
    });
  });

  it('counts Store request cardinality without treating listing projection as a per-card read', () => {
    expect(
      countStoreActivationRequests([
        'https://example.test/blackbox-records/store/',
        'https://api.example.test/api/store/listing-prices',
        'https://api.example.test/api/store/items/item-one',
      ]),
    ).toEqual({ listingProjection: 1, perCardStoreOffer: 1, storeHtml: 1 });
  });

  it('rejects hidden, delayed, or incomplete Store timing runs', () => {
    expect(
      storeActivationRejectionReasons({
        cardCount: 103,
        expectedCardCount: 104,
        storeHtmlRequestStartMs: 1200,
        visibilityState: 'hidden',
      }),
    ).toEqual([
      'document visibility was hidden',
      'Store HTML request started after 1200 ms',
      'expected 104 Store cards, found 103',
    ]);
  });
});
