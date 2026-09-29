import { globSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const currentDir = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(currentDir, '..', '..');
const httpFiles = [...globSync('src/{interfaces/http,platform/interfaces/http}/**/*.ts', { cwd: backendRoot })];

describe('Prisma architecture boundary', () => {
  it('keeps Prisma imports out of the HTTP layer', () => {
    for (const file of httpFiles) {
      const source = readFileSync(resolve(backendRoot, file), 'utf8');

      expect(source).not.toContain('@prisma/');
      expect(source).not.toContain('/generated/prisma');
    }
  });
});
