import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getInternalOpenApiDocument, getPublicOpenApiDocument } from '../src/interfaces/http/openapi/api-documents';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const backendDirectory = resolve(scriptDirectory, '..');
const openApiDirectory = resolve(backendDirectory, 'openapi');

async function writeOpenApiDocument(filename: string, document: unknown): Promise<void> {
  await mkdir(openApiDirectory, {
    recursive: true,
  });

  await writeFile(resolve(openApiDirectory, filename), `${JSON.stringify(document, null, 2)}\n`, 'utf8');
}

await Promise.all([
  writeOpenApiDocument('public-openapi.json', getPublicOpenApiDocument()),
  writeOpenApiDocument('internal-openapi.json', getInternalOpenApiDocument()),
]);
