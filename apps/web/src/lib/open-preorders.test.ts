import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readOpenPreorders } from './open-preorders';

afterEach(() => vi.unstubAllEnvs());

describe('open pre-order reader outside the hosted renderer', () => {
  it('claims no open pre-orders without a fixture', () => {
    vi.stubEnv('BLACKBOX_PREORDER_PROJECTION', '');
    expect(readOpenPreorders()).toEqual([]);
  });

  it('reads the fixture projection named by BLACKBOX_PREORDER_PROJECTION', () => {
    const items = [
      { storeItemSlug: 'sidus-vinyl', displayPrice: '€28.00', shipEstimate: { kind: 'date', date: '2026-12-04' } },
    ];
    const file = join(mkdtempSync(join(tmpdir(), 'preorders-')), 'projection.json');
    writeFileSync(file, JSON.stringify({ items }));
    vi.stubEnv('BLACKBOX_PREORDER_PROJECTION', file);
    expect(readOpenPreorders()).toEqual(items);
  });
});
