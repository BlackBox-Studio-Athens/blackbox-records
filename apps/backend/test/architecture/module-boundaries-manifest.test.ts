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

  it('requires hard-closure metadata for open-temporary modules', () => {
    const manifest = JSON.parse(JSON.stringify(loadModuleBoundariesManifest())) as {
      modules: Record<string, Record<string, unknown>>;
    };
    delete manifest.modules['cms-admin'].temporaryOpenReason;

    expect(validateManifest(manifest)).toContain(
      'Module cms-admin open-temporary metadata missing non-empty temporaryOpenReason',
    );
  });

  it('rejects unapproved open-temporary modules', () => {
    const manifest = JSON.parse(JSON.stringify(loadModuleBoundariesManifest())) as {
      modules: Record<string, Record<string, unknown>>;
    };
    manifest.modules.stock.status = 'open-temporary';
    manifest.modules.stock.temporaryOpenReason = 'Temporary test reason.';
    manifest.modules.stock.exitCriteria = ['Close the temporary test exception.'];
    manifest.modules.stock.forbiddenWhileOpen = ['Do not keep the temporary test exception.'];

    expect(validateManifest(manifest)).toContain(
      'Module stock is open-temporary but is not in the approved initial open-temporary set',
    );
  });
});
