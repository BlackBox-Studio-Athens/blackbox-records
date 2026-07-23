import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  assertDecapBuildArtifacts,
  assertDisabledAdminAssetTexts,
  DecapBuildArtifactError,
} from '../src/lib/admin/decap-build-validation';
import { DecapRuntimeConfigError, resolveDecapBackendMode } from '../src/lib/admin/decap-runtime-config';

const webRoot = fileURLToPath(new URL('..', import.meta.url));

async function main(): Promise<void> {
  const expectedMode = resolveDecapBackendMode({ environment: process.env, isDevelopment: false });
  const [indexHtml, configYaml] = await Promise.all([
    readFile(resolve(webRoot, 'dist', 'admin', 'index.html'), 'utf8'),
    readFile(resolve(webRoot, 'dist', 'admin', 'config.yml'), 'utf8'),
  ]);

  assertDecapBuildArtifacts({ configYaml, expectedMode, indexHtml });
  if (expectedMode === 'disabled') {
    assertDisabledAdminAssetTexts(await readAdminTextAssets(resolve(webRoot, 'dist', 'admin')));
  }
  console.log(`Decap build mode verified: ${expectedMode}.`);
}

async function readAdminTextAssets(directory: string, relativeRoot = ''): Promise<Record<string, string>> {
  const assets: Record<string, string> = {};
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const relativePath = relativeRoot ? `${relativeRoot}/${entry.name}` : entry.name;
    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      Object.assign(assets, await readAdminTextAssets(absolutePath, relativePath));
    } else if (/\.(?:css|html|js|json|svg|txt|ya?ml)$/i.test(entry.name)) {
      assets[relativePath] = await readFile(absolutePath, 'utf8');
    }
  }

  return assets;
}

main().catch((error: unknown) => {
  if (error instanceof DecapRuntimeConfigError || error instanceof DecapBuildArtifactError) {
    console.error(error.message);
  } else {
    console.error('Decap build-mode check could not read or validate the generated admin artifacts.');
  }

  process.exitCode = 1;
});
