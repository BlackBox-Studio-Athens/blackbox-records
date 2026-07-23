import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertDecapBuildArtifacts, DecapBuildArtifactError } from '../src/lib/admin/decap-build-validation';
import { DecapRuntimeConfigError, resolveDecapBackendMode } from '../src/lib/admin/decap-runtime-config';

const webRoot = fileURLToPath(new URL('..', import.meta.url));

async function main(): Promise<void> {
  const expectedMode = resolveDecapBackendMode({ environment: process.env, isDevelopment: false });
  const [indexHtml, configYaml] = await Promise.all([
    readFile(resolve(webRoot, 'dist', 'admin', 'index.html'), 'utf8'),
    readFile(resolve(webRoot, 'dist', 'admin', 'config.yml'), 'utf8'),
  ]);

  assertDecapBuildArtifacts({ configYaml, expectedMode, indexHtml });
  console.log(`Decap build mode verified: ${expectedMode}.`);
}

main().catch((error: unknown) => {
  if (error instanceof DecapRuntimeConfigError || error instanceof DecapBuildArtifactError) {
    console.error(error.message);
  } else {
    console.error('Decap build-mode check could not read or validate the generated admin artifacts.');
  }

  process.exitCode = 1;
});
