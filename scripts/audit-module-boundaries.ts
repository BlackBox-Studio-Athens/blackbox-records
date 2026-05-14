import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { loadModuleBoundariesManifest, validateManifest } = require('./module-boundaries-manifest.cjs') as {
  loadModuleBoundariesManifest: () => unknown;
  validateManifest: (manifest: unknown) => string[];
};

const manifest = loadModuleBoundariesManifest();
const validationErrors = validateManifest(manifest);

if (validationErrors.length > 0) {
  console.error('Module boundary audit failed:');
  for (const validationError of validationErrors) {
    console.error(`- ${validationError}`);
  }
  process.exit(1);
}

console.log('Module boundary audit passed.');
