import assert from 'node:assert/strict';
import { copyFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { formatCacheIdentity, formatCacheLocation } from './format-check.mjs';

test('format cache identity changes with formatting inputs and stays under the ignored cache directory', async () => {
  const directory = await mkdtemp(path.join(process.cwd(), '.codex-artifacts', 'format-identity-'));
  try {
    for (const filename of [
      'package.json',
      'pnpm-lock.yaml',
      'prettier.config.mjs',
      '.prettierignore',
      '.editorconfig',
    ])
      await copyFile(filename, path.join(directory, filename));
    const original = await formatCacheIdentity(directory);
    const location = await formatCacheLocation(directory);
    assert.match(location, /node_modules[\\/]\.cache[\\/]blackbox-validation[\\/]prettier-[a-f0-9]{64}\.cache$/);
    await writeFile(
      path.join(directory, 'prettier.config.mjs'),
      `${await readFile(path.join(directory, 'prettier.config.mjs'), 'utf8')}\n// changed\n`,
    );
    assert.notEqual(await formatCacheIdentity(directory), original);
  } finally {
    assert.equal(path.dirname(directory), path.resolve(process.cwd(), '.codex-artifacts'));
    await rm(directory, { recursive: true, force: true });
  }
});
