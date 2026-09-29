import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';

const { loadModuleBoundariesManifest } = createRequire(import.meta.url)('./module-boundaries-manifest.cjs');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('real ESLint rejects private module imports, workspace bypasses, and Astro violations', async () => {
  // Fixtures reuse real file paths; type-aware parsing would lint the on-disk source instead of the fixture text.
  const eslint = new ESLint({ cwd: root, overrideConfig: tseslint.configs.disableTypeChecked });
  const cases = [
    [
      'apps/backend/src/application/commerce/checkout/index.ts',
      "import { createPrismaClient } from '../../../infrastructure/persistence/prisma/create-prisma-client';\nexport { createPrismaClient };\n",
      'boundaries/dependencies',
    ],
    [
      'apps/web/src/components/music/player-provider-data.ts',
      "import type { paths } from '@blackbox/api-client/src/generated/public/schema';\nexport type { paths };\n",
      'no-restricted-imports',
    ],
    [
      'apps/web/src/components/music/MusicStreamingServiceListenTrigger.astro',
      "---\nimport { createPublicCheckoutApi } from '../store/checkout/public-checkout-api';\nvoid createPublicCheckoutApi;\n---\n<div />\n",
      'boundaries/dependencies',
    ],
  ];
  for (const [filePath, source, rule] of cases) {
    const results = await eslint.lintText(source, { filePath: path.resolve(root, filePath) });
    assert.ok(
      results.flatMap(({ messages }) => messages).some(({ ruleId }) => ruleId === rule),
      `${filePath} must reject ${rule}: ${JSON.stringify(results.flatMap(({ messages }) => messages))}`,
    );
  }
});

test('module boundary violations explain the public API', async () => {
  const eslint = new ESLint({ cwd: root, overrideConfig: tseslint.configs.disableTypeChecked });
  const [result] = await eslint.lintText(
    "import { createPrismaClient } from '../../../infrastructure/persistence/prisma/create-prisma-client';\nexport { createPrismaClient };\n",
    { filePath: path.resolve(root, 'apps/backend/src/application/commerce/checkout/index.ts') },
  );
  assert.match(result.messages.map(({ message }) => message).join('\n'), /internals are private/);
});

test('pattern exports make every matching kit file public except tests', async () => {
  const eslint = new ESLint({ cwd: root, overrideConfig: tseslint.configs.disableTypeChecked });
  const lint = async (filePath, source) => {
    const [result] = await eslint.lintText(source, { filePath: path.resolve(root, filePath) });
    return result.messages.filter(({ ruleId }) => ruleId === 'boundaries/dependencies');
  };
  assert.deepEqual(
    await lint(
      'apps/staff/src/components/orders/OrderDetail.tsx',
      "import { Label } from '@/components/ui/label';\nexport { Label };\n",
    ),
    [],
  );
  const uiFoundation = loadModuleBoundariesManifest().modules['ui-foundation'].providedEntrypoints;
  assert.ok(uiFoundation.includes('apps/web/src/components/ui/grid-pattern.astro'));
  assert.ok(!uiFoundation.some((file) => file.includes('.test.')));
});
