import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { loadModuleBoundariesManifest, validateManifest } =
  require('../../../../scripts/module-boundaries-manifest.cjs') as {
    loadModuleBoundariesManifest: () => unknown;
    validateManifest: (manifest: unknown) => string[];
  };

describe('Module boundaries manifest', () => {
  it('stays internally consistent with the repo', () => {
    const manifest = loadModuleBoundariesManifest();
    expect(validateManifest(manifest)).toEqual([]);
  });
});
