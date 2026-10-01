import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { commandTier, loadPolicy } from './feedback-policy.mjs';

const policy = loadPolicy();
const text = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const read = (file) => JSON.parse(text(file));
const { scripts } = read('package.json');
const commandGuard = 'scripts/agent-hooks/command-guard.mjs';
const children = (directory, keep) =>
  readdirSync(new URL(`../${directory}/`, import.meta.url))
    .map((name) => `${directory}/${name}`)
    .filter(keep);

/** Commands of `event` hooks whose matcher selects `tool`; Claude Code and Codex read matchers as anchored regexes. */
function hookCommands(config, event, tool) {
  return (config.hooks?.[event] ?? [])
    .filter(({ matcher }) => !matcher || matcher === '*' || new RegExp(`^(?:${matcher})$`).test(tool))
    .flatMap(({ hooks }) => hooks)
    .map(({ command = '', commandWindows = '', args = [] }) => ({
      command: [command, ...args].join(' '),
      commandWindows,
    }));
}

test('every root command is classified and every classified command exists', () => {
  const classified = Object.values(policy.commands).flat();
  assert.deepEqual(
    Object.keys(scripts).filter((name) => !classified.includes(name)),
    [],
    'root commands missing from feedback-policy.json',
  );
  assert.deepEqual(
    classified.filter((name) => !(name in scripts)),
    [],
    'feedback-policy.json classifies commands package.json lacks',
  );
});

test('release-tier commands pass through the feedback guard first', () => {
  assert.deepEqual(
    policy.commands.release.filter((name) => !scripts[name]?.startsWith(`node scripts/feedback-guard.mjs ${name} && `)),
    [],
    'release-tier commands not routed through scripts/feedback-guard.mjs',
  );
});

test('whole-package suites are classified and pass through the feedback guard first', () => {
  const { packages } = policy.packageSuites;
  const runsWholePackage = /\b(vitest|astro check|tsc|eslint)\b/;
  const manifests = ['apps', 'packages']
    .flatMap((group) =>
      children(group, (directory) => existsSync(new URL(`../${directory}/package.json`, import.meta.url))),
    )
    .map((directory) => read(`${directory}/package.json`));
  const problems = [];
  for (const { name, scripts: packageScripts = {} } of manifests)
    for (const [script, body] of Object.entries(packageScripts)) {
      const listed = packages[name]?.includes(script);
      if (!listed && !runsWholePackage.test(body)) continue;
      if (!listed) problems.push(`${name}:${script} runs a whole-package suite but packageSuites omits it`);
      else if (!body.startsWith(`node ../../scripts/feedback-guard.mjs ${name}:${script} && `))
        problems.push(`${name}:${script} does not start with scripts/feedback-guard.mjs`);
    }
  for (const [name, listed] of Object.entries(packages))
    for (const script of listed)
      if (!manifests.some((manifest) => manifest.name === name && manifest.scripts?.[script]))
        problems.push(`${name}:${script} is classified but does not exist`);
  assert.deepEqual(problems, []);
});

test('guarded leaf scripts call the fail-closed guard; validate entry points check their modes', () => {
  const problems = [];
  for (const [file, { command }] of Object.entries(policy.guardedScripts)) {
    const tier = commandTier(policy, command);
    if (!existsSync(new URL(`../${file}`, import.meta.url))) problems.push(`${file} does not exist`);
    else if (tier === 'release') {
      if (!/^\s*guardScript\(import\.meta\.url\);$/m.test(text(file)))
        problems.push(`${file} does not call guardScript(import.meta.url) from scripts/feedback-guard.mjs`);
    } else if (!command.startsWith('validate'))
      problems.push(
        `${file} belongs to ${tier ?? 'unclassified'} \`${command}\`; list release-tier or validate scripts`,
      );
    else if (!/\bassertValidationAllowed\(|from '\.\/validate\.mjs'/.test(text(file)))
      problems.push(`${file} neither checks validation modes nor delegates to scripts/validate.mjs`);
  }
  assert.match(text('scripts/validate.mjs'), /\bassertValidationAllowed\(/);
  assert.deepEqual(problems, []);
});

test('committed run configurations that start release-tier work carry the maintainer override', () => {
  const release = children('.run', (file) => file.endsWith('.run.xml')).filter((file) => {
    const xml = text(file);
    const names = [...xml.matchAll(/<script value="([^"]+)"/g)].map(([, name]) => name);
    const args = (xml.match(/<arguments value="([^"]*)"/)?.[1] ?? '').split(/\s+/);
    return names.some(
      (name) =>
        commandTier(policy, name) === 'release' ||
        (name.startsWith('validate') && args.some((arg) => policy.releaseTier.validateModes.includes(arg))),
    );
  });
  assert.ok(release.includes('.run/BlackBox Validate.run.xml'), 'the Validate run configuration is release-tier');
  assert.deepEqual(
    release.filter((file) => !text(file).includes(`<env name="${policy.releaseTier.overrideEnv}" value="1" />`)),
    [],
    `release-tier run configurations without ${policy.releaseTier.overrideEnv}=1`,
  );
});

test('the end-to-end and grant commands run their guarded scripts', () => {
  assert.match(
    scripts['test:e2e'] ?? '',
    /(^|\s)scripts\/run-e2e\.mjs(\s|$)/,
    'test:e2e does not run scripts/run-e2e.mjs',
  );
  assert.match(
    scripts[policy.releaseTier.grantCommand] ?? '',
    /(^|\s)scripts\/feedback-grant\.mjs(\s|$)/,
    `${policy.releaseTier.grantCommand} does not run scripts/feedback-grant.mjs`,
  );
});

test('Claude Code guards every shell and file tool and leases Chrome', () => {
  const settings = read('.claude/settings.json');
  for (const tool of ['Bash', 'PowerShell', 'Write', 'Edit', 'MultiEdit', 'NotebookEdit'])
    assert.ok(
      hookCommands(settings, 'PreToolUse', tool).some(({ command }) => command.includes(commandGuard)),
      `.claude/settings.json has no ${commandGuard} PreToolUse hook for ${tool}`,
    );
  assert.ok(
    hookCommands(settings, 'PreToolUse', 'mcp__claude-in-chrome__navigate').some(({ command }) =>
      command.includes('scripts/agent-hooks/browser-lease.mjs'),
    ),
    '.claude/settings.json has no scripts/agent-hooks/browser-lease.mjs hook for mcp__claude-in-chrome__.*',
  );
});

test('Codex guards its shell tool on every platform', () => {
  assert.ok(
    hookCommands(read('.codex/hooks.json'), 'PreToolUse', 'Bash').some(
      ({ command, commandWindows }) => command.includes(commandGuard) && commandWindows.includes(commandGuard),
    ),
    `.codex/hooks.json has no ${commandGuard} PreToolUse hook (command and commandWindows) for Bash`,
  );
});
