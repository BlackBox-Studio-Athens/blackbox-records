import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  assertSveltiaBuildArtifacts,
  assertDisabledAdminAssetTexts,
  SveltiaBuildArtifactError,
} from '../src/lib/admin/sveltia-build-validation';
import { SveltiaRuntimeConfigError, resolveSveltiaBackendMode } from '../src/lib/admin/sveltia-runtime-config';

const webRoot = fileURLToPath(new URL('..', import.meta.url));

async function main(): Promise<void> {
  const expectedMode = resolveSveltiaBackendMode({ environment: process.env, isDevelopment: false });
  const [indexHtml, configYaml, bootstrapJs] = await Promise.all([
    readFile(resolve(webRoot, 'dist', 'admin', 'index.html'), 'utf8'),
    readFile(resolve(webRoot, 'dist', 'admin', 'config.yml'), 'utf8'),
    readFile(resolve(webRoot, 'dist', 'admin', 'init.js'), 'utf8'),
  ]);

  assertSveltiaBuildArtifacts({ configYaml, expectedMode, indexHtml, bootstrapJs });
  if (expectedMode === 'disabled') {
    assertDisabledAdminAssetTexts(await readAdminTextAssets(resolve(webRoot, 'dist', 'admin')));
  }
  console.log(`Sveltia build mode verified: ${expectedMode}.`);
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
  if (error instanceof SveltiaRuntimeConfigError || error instanceof SveltiaBuildArtifactError) {
    console.error(error.message);
  } else {
    console.error('Sveltia build-mode check could not read or validate the generated admin artifacts.');
  }

  process.exitCode = 1;
});
