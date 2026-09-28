import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { execa } from 'execa';
import { changedFiles, localCommands, localSelection } from './validate-local.mjs';
import { runValidation } from './validate.mjs';

test('local checks select import dependents and broaden content/configuration without a build', () => {
  const web = localSelection(['apps/web/src/lib/store-cart.ts']);
  assert.deepEqual(web.scopes, ['web']);
  assert.equal(web.fullTests.size, 0);
  assert.equal(web.contracts, false);
  const commands = localCommands(web);
  assert.equal(commands.tests.length, 2);
  assert.ok(commands.tests.every(({ args }) => args.includes('related') && args.includes('--run')));
  assert.ok(commands.checks.some(({ args }) => args.includes('eslint')));
  assert.doesNotMatch(JSON.stringify(commands), /"build"|"test:unit"/);
  assert.deepEqual(localSelection(['packages/api-client/src/index.ts']).scopes, [
    'web',
    'staff',
    'backend',
    'api-client',
  ]);
  assert.deepEqual(localSelection(['packages/content-schema/src/index.ts']).scopes, [
    'web',
    'staff',
    'backend',
    'api-client',
  ]);
  for (const file of [
    'apps/web/src/content/artists/artist.md',
    'apps/web/astro.config.mjs',
    'apps/web/src/pages/index.astro',
  ]) {
    const selection = localSelection([file]);
    assert.ok(selection.fullTests.has('web'));
    assert.ok(localCommands(selection).tests.every(({ args }) => !args.includes('related')));
  }
  assert.ok(localSelection(['apps/backend/prisma/migrations/001.sql']).fullTests.has('backend'));
  const docs = localCommands(localSelection(['docs/guide.md', 'AGENTS.md', 'openspec/changes/test/tasks.md']));
  assert.deepEqual(docs.tests, []);
  assert.deepEqual(
    docs.checks.map(({ name }) => name),
    ['guidance', 'format'],
  );
  const workflow = localCommands(localSelection(['.github/workflows/pages.yml']));
  assert.deepEqual(
    workflow.tests.map(({ name }) => name),
    ['contracts'],
  );
  const tooling = localCommands(localSelection(['package.json', 'apps/web/vitest.config.ts', 'scripts/validate.mjs']));
  const backend = tooling.tests.find(({ name }) => name === 'tests:backend:vitest.config.ts');
  assert.ok(backend.args.includes('related'));
  assert.ok(backend.args.includes(path.resolve('scripts/validate.mjs')));
  assert.ok(!backend.args.includes(path.resolve('package.json')));
  assert.ok(!backend.args.includes(path.resolve('apps/web/vitest.config.ts')));
});

test('executable boundary policy selects boundary gates while OpenSpec prose stays lightweight', () => {
  for (const file of [
    'openspec/specs/module-boundaries/module-boundaries.manifest.json',
    '.dependency-cruiser.cjs',
    'eslint.config.mjs',
    'scripts/module-boundaries-manifest.cjs',
    'scripts/audit-module-boundaries.ts',
    'scripts/audit-commerce-boundaries.ts',
  ]) {
    const commands = localCommands(localSelection([file]));
    assert.ok(
      commands.checks.some(({ args }) => args.includes('check:boundaries')),
      file,
    );
    assert.ok(
      commands.tests.some(({ args }) => args.includes('test:contracts')),
      file,
    );
  }
  const prose = localCommands(localSelection(['openspec/specs/module-boundaries/spec.md']));
  assert.deepEqual(prose.tests, []);
  assert.deepEqual(
    prose.checks.map(({ name }) => name),
    ['guidance', 'format'],
  );
  assert.deepEqual(
    localCommands(localSelection([])).checks.map(({ name }) => name),
    ['guidance'],
  );
});

test('the Git selection includes committed, staged, unstaged, deleted and untracked work, but not ignored output', async (t) => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'blackbox-local-selection-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const git = (...args) => execa('git', args, { cwd, windowsHide: true });
  await git('init');
  for (const name of ['committed.ts', 'staged.ts', 'unstaged.ts', 'deleted.ts'])
    await writeFile(path.join(cwd, name), 'before');
  await writeFile(path.join(cwd, '.gitignore'), 'ignored.log\n');
  await git('add', '.');
  const commit = () =>
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'fixture');
  await commit();
  const { stdout: base } = await git('rev-parse', 'HEAD');
  await writeFile(path.join(cwd, 'committed.ts'), 'after');
  await git('add', 'committed.ts');
  await commit();
  await writeFile(path.join(cwd, 'staged.ts'), 'after');
  await git('add', 'staged.ts');
  await writeFile(path.join(cwd, 'unstaged.ts'), 'after');
  await rm(path.join(cwd, 'deleted.ts'));
  await writeFile(path.join(cwd, 'new file.ts'), 'new');
  await writeFile(path.join(cwd, 'ignored.log'), 'generated');
  assert.deepEqual(await changedFiles(cwd, base), [
    'committed.ts',
    'deleted.ts',
    'new file.ts',
    'staged.ts',
    'unstaged.ts',
  ]);
  assert.deepEqual(await changedFiles(cwd, 'HEAD'), ['deleted.ts', 'new file.ts', 'staged.ts', 'unstaged.ts']);
  await assert.rejects(changedFiles(cwd, 'missing-ref'));
});

test('targeted evidence is identified as local and propagates failed checks', async (t) => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'blackbox-local-evidence-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const options = {
    cwd,
    local: true,
    identify: async () => ({ sha: 'fixture', fingerprint: 'same' }),
    readPnpmVersion: async () => '12.6.0',
    log: () => {},
  };
  const phase = (name, exitCode) => ({ name, command: process.execPath, args: ['-e', `process.exit(${exitCode})`] });
  const pass = await runValidation({ ...options, phases: [phase('tests', 0), phase('checks', 0)] });
  assert.equal(pass.mode, 'local');
  assert.equal(pass.status, 'passed');
  assert.equal(pass.exitCode, 0);
  const failure = await runValidation({ ...options, phases: [phase('tests', 1), phase('checks', 0)] });
  assert.equal(failure.status, 'failed');
  assert.equal(failure.exitCode, 1);
});
