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
    manifest.modules.stock.status = 'open-temporary';

    expect(validateManifest(manifest)).toContain(
      'Module stock open-temporary metadata missing non-empty temporaryOpenReason',
    );
  });

  it('rejects reopening app-shell as a temporary module', () => {
    const manifest = JSON.parse(JSON.stringify(loadModuleBoundariesManifest())) as {
      modules: Record<string, Record<string, unknown>>;
    };
    manifest.modules['app-shell'].status = 'open-temporary';
    manifest.modules['app-shell'].temporaryOpenReason = 'Temporary test reason.';
    manifest.modules['app-shell'].exitCriteria = ['Close the temporary test exception.'];
    manifest.modules['app-shell'].forbiddenWhileOpen = ['Do not keep the temporary test exception.'];

    expect(validateManifest(manifest)).toContain(
      'Module app-shell is open-temporary but is not in the approved open-temporary set',
    );
  });

  it('rejects reopening cms-admin as a temporary module', () => {
    const manifest = JSON.parse(JSON.stringify(loadModuleBoundariesManifest())) as {
      modules: Record<string, Record<string, unknown>>;
    };
    manifest.modules['cms-admin'].status = 'open-temporary';
    manifest.modules['cms-admin'].temporaryOpenReason = 'Temporary test reason.';
    manifest.modules['cms-admin'].exitCriteria = ['Close the temporary test exception.'];
    manifest.modules['cms-admin'].forbiddenWhileOpen = ['Do not keep the temporary test exception.'];

    expect(validateManifest(manifest)).toContain(
      'Module cms-admin is open-temporary but is not in the approved open-temporary set',
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
      'Module stock is open-temporary but is not in the approved open-temporary set',
    );
  });

  it('rejects reopening platform-shared after closure', () => {
    const manifest = JSON.parse(JSON.stringify(loadModuleBoundariesManifest())) as {
      modules: Record<string, Record<string, unknown>>;
    };
    manifest.modules['platform-shared'].status = 'split-pending';

    expect(validateManifest(manifest)).toContain('platform-shared must remain closed after Phase 12 closure');
  });

  it('rejects platform-shared ownership of backend commerce domain contracts', () => {
    const manifest = JSON.parse(JSON.stringify(loadModuleBoundariesManifest())) as {
      modules: Record<string, Record<string, unknown>>;
    };
    manifest.modules['platform-shared'].roots = [
      ...((manifest.modules['platform-shared'].roots as string[]) ?? []),
      'apps/backend/src/domain/commerce/repositories/**',
    ];

    expect(validateManifest(manifest)).toContain(
      'platform-shared must not own backend commerce domain code: apps/backend/src/domain/commerce/repositories/**',
    );
  });

  it('rejects platform-shared ownership of frontend UI foundation code', () => {
    const manifest = JSON.parse(JSON.stringify(loadModuleBoundariesManifest())) as {
      modules: Record<string, Record<string, unknown>>;
    };
    manifest.modules['platform-shared'].providedEntrypoints = [
      ...((manifest.modules['platform-shared'].providedEntrypoints as string[]) ?? []),
      'apps/web/src/components/ui/button.tsx',
    ];

    expect(validateManifest(manifest)).toContain(
      'platform-shared must not own frontend UI foundation code: apps/web/src/components/ui/button.tsx',
    );
  });

  it('rejects platform-shared ownership of operator auth code', () => {
    const manifest = JSON.parse(JSON.stringify(loadModuleBoundariesManifest())) as {
      modules: Record<string, Record<string, unknown>>;
    };
    manifest.modules['platform-shared'].providedEntrypoints = [
      ...((manifest.modules['platform-shared'].providedEntrypoints as string[]) ?? []),
      'apps/backend/src/interfaces/http/auth/index.ts',
    ];

    expect(validateManifest(manifest)).toContain(
      'platform-shared must not own operator auth code: apps/backend/src/interfaces/http/auth/index.ts',
    );
  });

  it('rejects platform-shared ownership of backend persistence adapters', () => {
    const manifest = JSON.parse(JSON.stringify(loadModuleBoundariesManifest())) as {
      modules: Record<string, Record<string, unknown>>;
    };
    manifest.modules['platform-shared'].providedEntrypoints = [
      ...((manifest.modules['platform-shared'].providedEntrypoints as string[]) ?? []),
      'apps/backend/src/infrastructure/persistence/prisma/index.ts',
    ];

    expect(validateManifest(manifest)).toContain(
      'platform-shared must not own backend persistence adapters: apps/backend/src/infrastructure/persistence/prisma/index.ts',
    );
  });

  it('rejects platform-shared ownership of Stripe integration code', () => {
    const manifest = JSON.parse(JSON.stringify(loadModuleBoundariesManifest())) as {
      modules: Record<string, Record<string, unknown>>;
    };
    manifest.modules['platform-shared'].providedEntrypoints = [
      ...((manifest.modules['platform-shared'].providedEntrypoints as string[]) ?? []),
      'apps/backend/src/infrastructure/stripe/index.ts',
    ];

    expect(validateManifest(manifest)).toContain(
      'platform-shared must not own Stripe integration code: apps/backend/src/infrastructure/stripe/index.ts',
    );
  });

  it('requires named SPI surfaces to target spi.ts entrypoints', () => {
    const manifest = JSON.parse(JSON.stringify(loadModuleBoundariesManifest())) as {
      modules: Record<string, Record<string, unknown>>;
    };
    manifest.modules['commerce-domain'].namedInterfaces = {
      'repository-spi': 'apps/backend/src/domain/commerce/repositories/not-spi.ts',
    };

    expect(validateManifest(manifest)).toContain(
      'Module commerce-domain named SPI repository-spi must target a spi.ts entrypoint: apps/backend/src/domain/commerce/repositories/not-spi.ts',
    );
  });

  it('rejects unapproved module-level ports and adapters directories', () => {
    const manifest = JSON.parse(JSON.stringify(loadModuleBoundariesManifest())) as {
      modules: Record<string, Record<string, unknown>>;
    };
    manifest.modules['checkout-core'].roots = [
      ...((manifest.modules['checkout-core'].roots as string[]) ?? []),
      'apps/backend/src/application/commerce/checkout/adapters/**',
    ];

    expect(validateManifest(manifest)).toContain(
      'Module checkout-core declares unapproved ports/adapters path: apps/backend/src/application/commerce/checkout/adapters/**',
    );
  });
});
