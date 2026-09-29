import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkInventory, checkModuleGraph, checkRootTests } from './check-module-projects.mjs';
import { moduleTestProjects } from './module-test-projects.ts';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execa } from 'execa';

test('missing and duplicate native test ownership fail', () => {
  const node = moduleTestProjects('backend', {}, 'node');
  const worker = moduleTestProjects('backend', {}, 'worker');
  const spec = 'apps/backend/src/platform/discovery.spec.ts';
  const workerSpec = 'apps/backend/src/platform/discovery.worker.spec.ts';
  assert.doesNotThrow(() => checkInventory([spec, workerSpec], [...node, ...worker]));
  assert.throws(() => checkInventory([spec], worker), /found none/);
  assert.throws(() => checkInventory([spec], [...node, ...node]), /found backend-platform, backend-platform/);

  const webNode = moduleTestProjects('web', {}, 'node');
  const request = moduleTestProjects('web', {}, 'request');
  const requestSpec = 'apps/web/test/discovery.request.spec.ts';
  assert.doesNotThrow(() => checkInventory([requestSpec], [...webNode, ...request]));
  assert.throws(() => checkInventory([requestSpec], webNode), /found none/);
});

test('root node tests belong to exactly one group and must exist', () => {
  const group = (...files) => `node --test ${files.map((file) => `"${file}"`).join(' ')}`;
  const scripts = {
    'test:tooling': group('scripts/a.test.mjs', 'hooks/*.test.mjs'),
    'test:content': group('scripts/b.test.mjs'),
  };
  const files = ['scripts/a.test.mjs', 'scripts/b.test.mjs', 'hooks/x.test.mjs'];
  assert.doesNotThrow(() => checkRootTests(scripts, files));
  assert.throws(() => checkRootTests(scripts, [...files, 'scripts/c.test.mjs']), /c\.test\.mjs: .*found none/);
  assert.throws(
    () => checkRootTests({ ...scripts, 'test:content': group('scripts/b.test.mjs', 'scripts/a.test.mjs') }, files),
    /a\.test\.mjs: .*found test:tooling, test:content/,
  );
  assert.throws(
    () => checkRootTests({ ...scripts, 'test:content': group('scripts/b.test.mjs', 'scripts/gone.test.mjs') }, files),
    /test:content: no file matches scripts\/gone\.test\.mjs/,
  );
});

test('actual module cycles fail regardless of permitted dependencies', () => {
  const nodes = Object.fromEntries(['a', 'b'].map((name) => [name, { name, data: { root: name, tags: ['module'] } }]));
  assert.throws(
    () => checkModuleGraph({ nodes, dependencies: { a: [{ target: 'b' }], b: [{ target: 'a' }] } }),
    /Module cycle/,
  );
  assert.throws(
    () => checkModuleGraph({ nodes, dependencies: { a: [], b: [] } }, ['apps/unknown/src/file.ts']),
    /Unknown source ownership/,
  );
});

test('native Nx affected handles Git file states, shared inputs, and actual consumers', async (t) => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'blackbox-nx-'));
  t.after(async () => {
    assert.ok(path.resolve(cwd).startsWith(path.join(os.tmpdir(), 'blackbox-nx-')));
    await rm(cwd, { recursive: true, force: true });
  });
  const git = (...args) => execa('git', args, { cwd, windowsHide: true });
  await symlink(
    path.resolve('node_modules'),
    path.join(cwd, 'node_modules'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  const put = (file, value) => writeFile(path.join(cwd, file), value);
  for (const name of ['a', 'b']) {
    await mkdir(path.join(cwd, name));
    await put(
      `${name}/project.json`,
      JSON.stringify({
        name,
        targets: { test: { command: 'node --version', inputs: ['default', '^default'] } },
        namedInputs: { default: ['{projectRoot}/**/*', ...(name === 'a' ? ['{workspaceRoot}/shared.css'] : [])] },
      }),
    );
  }
  await put(
    'nx.json',
    JSON.stringify({ pluginsConfig: { '@nx/js': { analyzeSourceFiles: true } }, neverConnectToCloud: true }),
  );
  await put('package.json', JSON.stringify({ private: true }));
  await put('.gitignore', '.nx/\nnode_modules/\n');
  await put('a/index.ts', 'export const value = 1;\n');
  await put('b/index.ts', "export { value } from '../a/index';\n");
  await put('shared.css', 'body {}\n');
  await git('init');
  await git('add', '.');
  await git(
    '-c',
    'core.hooksPath=',
    '-c',
    'user.name=Fixture',
    '-c',
    'user.email=fixture@example.invalid',
    'commit',
    '-m',
    'fixture',
  );
  const affected = async () => {
    const { stdout } = await execa(
      process.execPath,
      [path.resolve('node_modules/nx/dist/bin/nx.js'), 'show', 'projects', '--affected', '--base=HEAD', '--json'],
      {
        cwd,
        windowsHide: true,
        env: {
          NX_DAEMON: 'false',
          NX_ISOLATE_PLUGINS: 'false',
          NX_WORKSPACE_ROOT_PATH: cwd,
          NX_WORKSPACE_ROOT: cwd,
        },
      },
    );
    return JSON.parse(stdout).sort();
  };
  assert.deepEqual(await affected(), []);
  for (const state of ['unstaged', 'staged', 'untracked', 'deleted', 'renamed', 'shared']) {
    await git('reset', '--hard', 'HEAD');
    if (state === 'deleted') await rm(path.join(cwd, 'a/index.ts'));
    else if (state === 'renamed') await git('mv', 'a/index.ts', 'a/renamed.ts');
    else
      await put(
        state === 'shared' ? 'shared.css' : state === 'untracked' ? 'a/new.ts' : 'a/index.ts',
        '/* changed */\n',
      );
    if (state === 'staged') await git('add', 'a/index.ts');
    assert.deepEqual(await affected(), ['a', 'b'], state);
    if (state === 'untracked') await rm(path.join(cwd, 'a/new.ts'));
  }
});
