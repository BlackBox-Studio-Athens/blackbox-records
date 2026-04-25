import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import openapiTS, { astToString } from 'openapi-typescript';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const packageDirectory = resolve(scriptDirectory, '..');
const workspaceDirectory = resolve(packageDirectory, '..', '..');
const generatedDirectory = resolve(packageDirectory, 'src', 'generated');
const publicOpenApiPath = resolve(workspaceDirectory, 'apps', 'backend', 'openapi', 'public-openapi.json');
const internalOpenApiPath = resolve(workspaceDirectory, 'apps', 'backend', 'openapi', 'internal-openapi.json');

async function generateSchemaFile(sourcePath: string, targetPath: string): Promise<void> {
  const sourceDocument = JSON.parse(await readFile(sourcePath, 'utf8'));
  const abstractSyntaxTree = await openapiTS(sourceDocument, {
    alphabetize: true,
    exportType: true,
  });

  await mkdir(dirname(targetPath), {
    recursive: true,
  });

  await writeFile(targetPath, `${astToString(abstractSyntaxTree)}\n`, 'utf8');
}

await Promise.all([
  generateSchemaFile(publicOpenApiPath, resolve(generatedDirectory, 'public', 'schema.ts')),
  generateSchemaFile(internalOpenApiPath, resolve(generatedDirectory, 'internal', 'schema.ts')),
]);
