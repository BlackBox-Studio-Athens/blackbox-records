import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Wrangler applies `<migrations_dir>/*.sql` only, so a folder-style migration is silently never applied.
const migrationsDir = fileURLToPath(new URL('../../prisma/migrations/', import.meta.url));

describe('D1 migration files', () => {
  const entries = readdirSync(migrationsDir, { withFileTypes: true });

  it('are flat NNNN_snake_case.sql files', () => {
    const invalid = entries
      .filter((entry) => !entry.isFile() || !/^\d{4}_[a-z0-9]+(?:_[a-z0-9]+)*\.sql$/.test(entry.name))
      .map((entry) => entry.name);
    expect(invalid).toEqual([]);
  });

  it('have unique numbers, consecutive from 0001', () => {
    const numbers = entries.map((entry) => Number(entry.name.slice(0, 4))).sort((a, b) => a - b);
    expect(numbers).toEqual(numbers.map((_, index) => index + 1));
  });
});
