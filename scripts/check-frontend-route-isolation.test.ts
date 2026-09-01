import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { assertFrontendRouteIsolation } from './check-frontend-route-isolation';

const tempDirs: string[] = [];

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe('frontend route isolation', () => {
  it('rejects stock files in the public artifact', () => {
    const dist = createDist(['index.html', 'stock/index.html']);
    expect(() => assertFrontendRouteIsolation('web', dist)).toThrow('stock/index.html');
  });

  it.each(['admin/index.html', 'store/index.html'])('rejects %s in the staff artifact', (violation) => {
    const dist = createStaffDist(violation);
    expect(() => assertFrontendRouteIsolation('staff', dist)).toThrow(violation);
  });

  it('accepts the staff route and asset allowlist', () => {
    expect(() => assertFrontendRouteIsolation('staff', createStaffDist())).not.toThrow();
  });
});

function createStaffDist(violation?: string): string {
  return createDist([
    '_headers',
    '_astro/app.js',
    'favicon-96x96.png',
    'favicon.ico',
    'favicon.svg',
    'index.html',
    'robots.txt',
    'stock/index.html',
    ...(violation ? [violation] : []),
  ]);
}

function createDist(files: string[]): string {
  const root = mkdtempSync(path.join(tmpdir(), 'blackbox-route-isolation-'));
  tempDirs.push(root);

  for (const file of files) {
    const target = path.join(root, file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, '');
  }

  return root;
}
