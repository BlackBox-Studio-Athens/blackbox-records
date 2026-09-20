import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { backendNodeTestFiles, resolveBackendWorkerMaxWorkers } from '../../vitest-test-selection';

async function testFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await testFiles(path)));
    else if (entry.name.endsWith('.test.ts'))
      files.push(relative(fileURLToPath(new URL('../..', import.meta.url)), path).replaceAll('\\', '/'));
  }
  return files;
}

describe('backend Vitest runtime selection', () => {
  it('keeps the explicit Node set disjoint and exhaustive with Workers', async () => {
    const all = (await testFiles(fileURLToPath(new URL('..', import.meta.url)))).sort();
    const node: string[] = [...backendNodeTestFiles].sort();
    expect(node).toHaveLength(21);
    expect(new Set(node).size).toBe(node.length);
    expect(node.every((file) => all.includes(file))).toBe(true);
    expect(all.filter((file) => !node.includes(file)).length + node.length).toBe(all.length);
    expect(all.includes('test/application/commerce/checkout/packing.test.ts')).toBe(true);
  });

  it('defaults a newly unclassified test to Workers and validates the diagnostic override', () => {
    const newFile = 'test/application/new-unclassified.test.ts';
    expect(backendNodeTestFiles.includes(newFile as (typeof backendNodeTestFiles)[number])).toBe(false);
    expect(resolveBackendWorkerMaxWorkers({ cpuCount: 6, memoryBytes: 24 * 1024 ** 3 })).toBe(3);
    expect(resolveBackendWorkerMaxWorkers({ cpuCount: 2, memoryBytes: 8 * 1024 ** 3 })).toBe(2);
    expect(resolveBackendWorkerMaxWorkers({ override: '1', cpuCount: 64, memoryBytes: 64 * 1024 ** 3 })).toBe(1);
    expect(() => resolveBackendWorkerMaxWorkers({ override: '4' })).toThrow(/must be 1, 2, or 3/);
  });
});
