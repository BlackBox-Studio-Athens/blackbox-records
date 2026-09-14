import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { runValidation } from './validate.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

// Run explicitly for runner acceptance; these deliberately invoke failing real tools.
test('real test, formatting, type, boundary and Astro build failures propagate', async (t) => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'blackbox-validation-acceptance-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const files = {
    'failing.test.mjs': "import assert from 'node:assert/strict'; assert.equal(1, 2, 'ASSERTION_SENTINEL');\n",
    'format.js': 'const bad={a:1,b:2};\n',
    'type.ts': "const value: number = 'TYPE_SENTINEL'; export { value };\n",
    'a.js': "import './b.js';\n",
    'b.js': 'export const b = 1;\n',
    'boundaries.cjs':
      "module.exports = { forbidden: [{ name: 'BOUNDARY_SENTINEL', severity: 'error', from: { path: 'a\\\\.js$' }, to: { path: 'b\\\\.js$' } }] };\n",
    'astro.config.mjs': "throw new Error('BUILD_SENTINEL');\n",
  };
  await mkdir(path.join(cwd, 'src/pages'), { recursive: true });
  for (const [name, content] of Object.entries(files)) await writeFile(path.join(cwd, name), content);
  const pnpm = (name, args, diagnostic) => ({ name, command: 'pnpm', args, cwd: root, diagnostic });
  const cases = [
    {
      name: 'test',
      command: process.execPath,
      args: ['--test', path.join(cwd, 'failing.test.mjs')],
      diagnostic: /ASSERTION_SENTINEL/,
    },
    pnpm('format', ['exec', 'prettier', path.join(cwd, 'format.js'), '--check'], /format\.js/),
    pnpm('type', ['exec', 'tsc', '--noEmit', '--skipLibCheck', path.join(cwd, 'type.ts')], /TS2322/),
    pnpm(
      'boundary',
      ['exec', 'depcruise', '--config', path.join(cwd, 'boundaries.cjs'), path.join(cwd, 'a.js')],
      /BOUNDARY_SENTINEL/,
    ),
    pnpm('build', ['--filter', '@blackbox/web', 'exec', 'astro', 'build', '--root', cwd], /BUILD_SENTINEL/),
  ];
  for (const phase of cases) {
    const summary = await runValidation({
      cwd,
      phases: [{ ...phase, env: { NODE_TEST_CONTEXT: undefined } }],
      jobs: 1,
      identify: async () => ({ fingerprint: 'isolated acceptance fixtures' }),
      readPnpmVersion: async () => '12.0.0',
      log: () => {},
    });
    assert.equal(summary.status, 'failed', phase.name);
    assert.notEqual(summary.exitCode, 0, phase.name);
    assert.match(await readFile(summary.phases[0].logPath, 'utf8'), phase.diagnostic, phase.name);
    console.log(`${phase.name}: real failure propagated (exit ${summary.exitCode})`);
  }
});
