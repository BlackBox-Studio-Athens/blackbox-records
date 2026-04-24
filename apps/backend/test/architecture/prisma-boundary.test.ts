import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const currentDir = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(currentDir, '..', '..');
const httpFiles = [
    resolve(backendRoot, 'src/interfaces/http/app.ts'),
    resolve(backendRoot, 'src/interfaces/http/auth/index.ts'),
    resolve(backendRoot, 'src/interfaces/http/auth/operator-identity.ts'),
    resolve(backendRoot, 'src/interfaces/http/error-handler.ts'),
    resolve(backendRoot, 'src/interfaces/http/not-found-handler.ts'),
    resolve(backendRoot, 'src/interfaces/http/openapi/api-documents.ts'),
    resolve(backendRoot, 'src/interfaces/http/routes/register-internal-routes.ts'),
    resolve(backendRoot, 'src/interfaces/http/routes/register-internal-stock-routes.ts'),
    resolve(backendRoot, 'src/interfaces/http/routes/internal-stock-services.ts'),
    resolve(backendRoot, 'src/interfaces/http/routes/register-public-routes.ts'),
];

describe('Prisma architecture boundary', () => {
    it('keeps Prisma imports out of the HTTP layer', () => {
        for (const file of httpFiles) {
            const source = readFileSync(file, 'utf8');

            expect(source).not.toContain('@prisma/');
            expect(source).not.toContain('/generated/prisma');
        }
    });
});
