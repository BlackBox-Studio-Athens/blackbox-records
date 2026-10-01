import assert from 'node:assert/strict';
import { globSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { HashPlanInspector } from 'nx/src/hasher/hash-plan-inspector.js';
import { createProjectGraphAsync } from 'nx/src/project-graph/project-graph.js';
import { findCycle } from 'nx/src/tasks-runner/task-graph-utils.js';
import { moduleTestProjects } from './module-test-projects.ts';

export function checkInventory(files, projects) {
  for (const file of files) {
    const owners = projects.filter(
      ({ root, test }) =>
        test.include.some((pattern) => path.matchesGlob(path.resolve(file), path.resolve(root, pattern))) &&
        !test.exclude.some((pattern) => path.matchesGlob(path.resolve(file), path.resolve(root, pattern))),
    );
    assert.equal(
      owners.length,
      1,
      `${file}: expected one test owner, found ${owners.map(({ test }) => test.name).join(', ') || 'none'}`,
    );
  }
}

/** package.json root test groups; each runs as the cached `workspace:test-<group>` target with its own inputs. */
export const rootTestGroups = ['test:agent', 'test:release', 'test:runner', 'test:boundaries', 'test:content'];

/** Root node tests run through exactly one package.json group; entries may be globs. */
export function checkRootTests(scripts, files) {
  const groups = rootTestGroups.map((name) => [
    name,
    [...scripts[name].matchAll(/"([^"]+\.test\.mjs)"/g)].map(([, entry]) => entry),
  ]);
  const matches = (file, entry) => path.posix.matchesGlob(file.replaceAll('\\', '/'), entry);
  for (const [name, entries] of groups) {
    for (const entry of entries)
      assert.ok(
        files.some((file) => matches(file, entry)),
        `${name}: no file matches ${entry}`,
      );
  }
  for (const file of files) {
    const owners = groups.filter(([, entries]) => entries.some((entry) => matches(file, entry))).map(([name]) => name);
    assert.equal(owners.length, 1, `${file}: expected one root test group, found ${owners.join(', ') || 'none'}`);
  }
}

const agentDocuments = ['AGENTS.md', 'CLAUDE.md', 'docs/agent-workflow.md', 'docs/agent-reference.md'];
const documentation = /^(docs|openspec\/changes)\/|^[^/]+\.md$/;

/**
 * A documentation-only change must leave every root task except formatting a cache hit, so no other
 * root task may hash documentation or OpenSpec change files. `plan` maps task ids to Nx hash-plan inputs.
 */
export function checkWorkspaceInputs(plan) {
  for (const [task, inputs] of Object.entries(plan)) {
    if (task === 'workspace:format') continue;
    const allowed = task === 'workspace:architecture' ? agentDocuments : [];
    const documents = inputs
      .filter((input) => input.startsWith('file:'))
      .map((input) => input.slice('file:'.length))
      .filter((file) => documentation.test(file) && !allowed.includes(file));
    assert.equal(
      documents.length,
      0,
      `${task} hashes documentation (${documents.slice(0, 3).join(', ')}); declare the files it reads instead of whole-repository inputs.`,
    );
  }
}

/**
 * Root package.json changes are mostly script edits, so the shared `toolchain` input must not hash it or every task
 * reruns. pnpm-lock.yaml records dependency ranges; root tasks keep package.json through `scriptRuntime`.
 */
export function checkToolchainInputs(nx) {
  assert.ok(
    !nx.namedInputs.toolchain.includes('{workspaceRoot}/package.json'),
    'nx.json toolchain hashes root package.json; give the reading task an explicit input instead.',
  );
}

export function checkModuleGraph(
  graph,
  files = globSync(['{apps,packages}/*/src/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,astro,css,json,sql}']),
) {
  const modules = Object.values(graph.nodes).filter(({ data }) =>
    data.tags?.some((tag) => ['module', 'application', 'generated'].includes(tag)),
  );
  const names = new Set(modules.map(({ name }) => name));
  const dependencies = Object.fromEntries(
    modules.map(({ name }) => [
      name,
      graph.dependencies[name].map(({ target }) => target).filter((target) => names.has(target)),
    ]),
  );
  // Use the pinned Nx cycle check; architectural permissions are deliberately absent here.
  const cycle = findCycle({ dependencies });
  assert.equal(cycle, null, `Module cycle: ${cycle?.join(' -> ')}`);
  for (const file of files) {
    const normalized = file.replaceAll('\\', '/');
    assert.ok(
      Object.values(graph.nodes).some(({ data }) => data.root !== '.' && normalized.startsWith(`${data.root}/`)),
      `Unknown source ownership: ${file}`,
    );
  }
}

async function main() {
  for (const app of ['web', 'staff', 'backend']) {
    const runtimes = app === 'backend' ? ['node', 'worker'] : app === 'web' ? ['node', 'request'] : ['node'];
    const projects = runtimes.flatMap((runtime) => moduleTestProjects(app, {}, runtime));
    const files = [...globSync(`apps/${app}/{src,test}/**/*.{test,spec}.{ts,tsx}`)];
    checkInventory(files, projects);
    console.log(`${app}: ${files.length} tests owned exactly once.`);
  }
  const rootTests = globSync([
    'scripts/**/*.test.mjs',
    '.codex/hooks/*.test.mjs',
    'apps/backend/test/emdash/*.test.mjs',
  ]);
  checkRootTests(JSON.parse(readFileSync('package.json', 'utf8')).scripts, rootTests);
  console.log(`root: ${rootTests.length} node tests owned by exactly one group.`);
  const graph = await createProjectGraphAsync();
  checkModuleGraph(graph);
  console.log('Native Nx ownership and module graph passed.');
  const inspector = new HashPlanInspector(graph);
  await inspector.init();
  const rootTargets = Object.entries(graph.nodes.workspace.data.targets)
    .filter(([, { executor }]) => executor !== 'nx:noop')
    .map(([name]) => name);
  checkWorkspaceInputs(inspector.inspectHashPlan(['workspace'], rootTargets, undefined, {}, {}, true));
  console.log(`Root task inputs exclude documentation (${rootTargets.length} tasks).`);
  checkToolchainInputs(JSON.parse(readFileSync('nx.json', 'utf8')));
  console.log('Shared toolchain input excludes root package.json.');
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
