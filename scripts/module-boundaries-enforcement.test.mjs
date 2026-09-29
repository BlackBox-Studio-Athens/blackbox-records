import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('real ESLint rejects private module imports, workspace bypasses, and Astro violations', async () => {
  const eslint = new ESLint({ cwd: root });
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
