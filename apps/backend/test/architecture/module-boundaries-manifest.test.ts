import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { loadModuleBoundariesManifest, validateManifest } =
  require('../../../../scripts/module-boundaries-manifest.cjs') as {
    loadModuleBoundariesManifest: () => unknown;
    validateManifest: (manifest: unknown) => string[];
  };

describe('Module boundaries manifest', { timeout: 15_000 }, () => {
  it('stays internally consistent with the repo', () => {
    const manifest = loadModuleBoundariesManifest();
    expect(validateManifest(manifest)).toEqual([]);
  });

  it('keeps Services inquiry surfaces inside existing closed modules', () => {
    const manifest = loadModuleBoundariesManifest() as {
      modules: Record<
        string,
        {
          allowedDependencies: string[];
          namedInterfaces: Record<string, string>;
          providedEntrypoints: string[];
          roots: string[];
        }
      >;
    };
    const storefrontCatalog = manifest.modules['storefront-catalog']!;
    const publicCommerceHttp = manifest.modules['public-commerce-http']!;

    expect(storefrontCatalog.roots).toContain('apps/web/src/**');
    expect(storefrontCatalog.providedEntrypoints).toContain('apps/web/src/components/services/ServicesInquiryForm.tsx');
    expect(storefrontCatalog.allowedDependencies).toContain('ui-foundation');
    expect(publicCommerceHttp.roots).toContain('apps/backend/src/interfaces/http/**');
    expect(publicCommerceHttp.providedEntrypoints).toContain(
      'apps/backend/src/interfaces/http/routes/register-public-routes.ts',
    );
    expect(publicCommerceHttp.namedInterfaces['public-contracts']).toBe(
      'apps/backend/src/interfaces/http/contracts/public-contracts.ts',
    );
    expect(publicCommerceHttp.allowedDependencies).toContain('email-application');
  });

  it('keeps the staff frontend isolated from public web ownership', () => {
    const manifest = loadModuleBoundariesManifest() as {
      modules: Record<
        string,
        {
          allowedWorkspaceInterfaces: Record<string, string[]>;
          project?: string;
          roots: string[];
        }
      >;
      workspaceBoundaries: Record<string, { packageRoot: string }>;
    };
    const staffModules = Object.values(manifest.modules).filter((module) =>
      module.project?.startsWith('apps/staff/src/'),
    );
    const operatorStock = manifest.modules['operator-stock']!;

    expect(manifest.workspaceBoundaries['@blackbox/staff']?.packageRoot).toBe('apps/staff');
    expect(staffModules.length).toBeGreaterThan(0);
    for (const module of staffModules) {
      expect(module.roots.every((root) => root.startsWith('apps/staff/src/'))).toBe(true);
      expect(module.roots).not.toEqual(expect.arrayContaining([expect.stringContaining('apps/web/')]));
      expect(module.allowedWorkspaceInterfaces['@blackbox/api-client'] ?? ['./internal']).toEqual(['./internal']);
    }
    expect(operatorStock.roots).not.toEqual(expect.arrayContaining([expect.stringContaining('apps/web/')]));
  });

  it('derives platform ownership from the native Nx project roots', () => {
    const manifest = loadModuleBoundariesManifest() as {
      modules: Record<string, { project: string; roots: string[] }>;
    };
    const webPlatform = manifest.modules['web-platform']!;
    const backendPlatform = manifest.modules['backend-platform']!;

    expect(webPlatform.project).toBe('apps/web/src/platform/project.json');
    expect(webPlatform.roots).toEqual(['apps/web/src/platform/**']);
    expect(backendPlatform.project).toBe('apps/backend/src/platform/project.json');
    expect(backendPlatform.roots).toEqual(['apps/backend/src/platform/**']);
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

  it('rejects reopening storefront-catalog as a temporary module', () => {
    const manifest = JSON.parse(JSON.stringify(loadModuleBoundariesManifest())) as {
      modules: Record<string, Record<string, unknown>>;
    };
    manifest.modules['storefront-catalog'].status = 'open-temporary';
    manifest.modules['storefront-catalog'].temporaryOpenReason = 'Temporary test reason.';
    manifest.modules['storefront-catalog'].exitCriteria = ['Close the temporary test exception.'];
    manifest.modules['storefront-catalog'].forbiddenWhileOpen = ['Do not keep the temporary test exception.'];

    expect(validateManifest(manifest)).toContain(
      'Module storefront-catalog is open-temporary but is not in the approved open-temporary set',
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

  it('keeps split platform modules closed and private from business modules', () => {
    const manifest = JSON.parse(JSON.stringify(loadModuleBoundariesManifest())) as {
      modules: Record<string, { allowedDependencies: string[]; status: string }>;
    };
    for (const moduleName of ['web-platform', 'backend-platform']) {
      manifest.modules[moduleName]!.status = 'split-pending';
      manifest.modules[moduleName]!.allowedDependencies = ['app-shell'];
    }

    const errors = validateManifest(manifest);
    expect(errors).toContain('web-platform must remain closed');
    expect(errors).toContain('web-platform must not depend on business modules');
    expect(errors).toContain('backend-platform must remain closed');
    expect(errors).toContain('backend-platform must not depend on business modules');
  });

  it('rejects backend-platform ownership of backend commerce domain contracts', () => {
    const manifest = JSON.parse(JSON.stringify(loadModuleBoundariesManifest())) as {
      modules: Record<string, Record<string, unknown>>;
    };
    manifest.modules['backend-platform'].roots = [
      ...((manifest.modules['backend-platform'].roots as string[]) ?? []),
      'apps/backend/src/domain/commerce/repositories/**',
    ];

    expect(validateManifest(manifest)).toContain(
      'backend-platform must not own backend commerce domain code: apps/backend/src/domain/commerce/repositories/**',
    );
  });

  it('rejects web-platform ownership of frontend UI foundation code', () => {
    const manifest = JSON.parse(JSON.stringify(loadModuleBoundariesManifest())) as {
      modules: Record<string, Record<string, unknown>>;
    };
    manifest.modules['web-platform'].providedEntrypoints = [
      ...((manifest.modules['web-platform'].providedEntrypoints as string[]) ?? []),
      'apps/web/src/components/ui/button.tsx',
    ];

    expect(validateManifest(manifest)).toContain(
      'web-platform must not own frontend UI foundation code: apps/web/src/components/ui/button.tsx',
    );
  });

  it('rejects backend-platform ownership of operator auth code', () => {
    const manifest = JSON.parse(JSON.stringify(loadModuleBoundariesManifest())) as {
      modules: Record<string, Record<string, unknown>>;
    };
    manifest.modules['backend-platform'].providedEntrypoints = [
      ...((manifest.modules['backend-platform'].providedEntrypoints as string[]) ?? []),
      'apps/backend/src/interfaces/http/auth/index.ts',
    ];

    expect(validateManifest(manifest)).toContain(
      'backend-platform must not own operator auth code: apps/backend/src/interfaces/http/auth/index.ts',
    );
  });

  it('rejects backend-platform ownership of backend persistence adapters', () => {
    const manifest = JSON.parse(JSON.stringify(loadModuleBoundariesManifest())) as {
      modules: Record<string, Record<string, unknown>>;
    };
    manifest.modules['backend-platform'].providedEntrypoints = [
      ...((manifest.modules['backend-platform'].providedEntrypoints as string[]) ?? []),
      'apps/backend/src/infrastructure/persistence/prisma/index.ts',
    ];

    expect(validateManifest(manifest)).toContain(
      'backend-platform must not own backend persistence adapters: apps/backend/src/infrastructure/persistence/prisma/index.ts',
    );
  });

  it('rejects backend-platform ownership of Stripe integration code', () => {
    const manifest = JSON.parse(JSON.stringify(loadModuleBoundariesManifest())) as {
      modules: Record<string, Record<string, unknown>>;
    };
    manifest.modules['backend-platform'].providedEntrypoints = [
      ...((manifest.modules['backend-platform'].providedEntrypoints as string[]) ?? []),
      'apps/backend/src/infrastructure/stripe/index.ts',
    ];

    expect(validateManifest(manifest)).toContain(
      'backend-platform must not own Stripe integration code: apps/backend/src/infrastructure/stripe/index.ts',
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
