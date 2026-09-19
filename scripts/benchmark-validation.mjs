import { mkdir, readFile, writeFile, rm, access, open, realpath, cp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execa } from 'execa';
import { sourceIdentity } from './validate.mjs';

function completedGates(commands, arm) {
  if (arm === 'candidate') return completedGates(commands, 'legacy') || completedGates(commands, 'aggregate');
  const gates = arm === 'aggregate' ? ['validate(?::full)?'] : ['test:unit', 'check', 'build'];
  return gates.every((gate) =>
    commands.some(
      ({ command, exit_code }) =>
        exit_code === 0 &&
        !/--(?:fast|editor)\b/.test(command) &&
        new RegExp(`\\bpnpm(?:\\.cmd)?\\s+${gate}(?=[\\s'"]|$)`).test(command),
    ),
  );
}
// Runnable parser checks: a successful CLI exit or a partial command is not a full gate.
assert.equal(completedGates([{ command: 'pnpm validate:fast --scope web', exit_code: 0 }], 'candidate'), false);
assert.equal(completedGates([{ command: 'pnpm validate --fast', exit_code: 0 }], 'candidate'), false);
assert.equal(completedGates([{ command: 'pnpm validate --editor', exit_code: 0 }], 'candidate'), false);
assert.equal(completedGates([{ command: 'pnpm validate', exit_code: 1 }], 'candidate'), false);
assert.equal(completedGates([{ command: "pwsh -Command 'pnpm validate'", exit_code: 0 }], 'candidate'), true);
assert.equal(
  completedGates(
    ['test:unit', 'check', 'build'].map((gate) => ({ command: `pnpm ${gate}`, exit_code: 0 })),
    'baseline',
  ),
  true,
);

const { values } = parseArgs({
  options: {
    baseline: { type: 'string' },
    candidate: { type: 'string' },
    mode: { type: 'string', default: 'commands' },
    repetitions: { type: 'string', default: '5' },
    rtk: { type: 'string', default: 'C:/Users/SVall/.local/bin/rtk.exe' },
    model: { type: 'string', default: 'gpt-5.6-luna' },
    effort: { type: 'string', default: 'high' },
    scenario: { type: 'string' },
    jobs: { type: 'string', default: '2' },
  },
});
if (!values.baseline || !values.candidate) throw new Error('Specify --baseline and --candidate.');
const arms = { baseline: path.resolve(values.baseline), candidate: path.resolve(values.candidate) };
if (arms.baseline === arms.candidate) throw new Error('Benchmark arms must be separate worktrees.');
const repetitions = Number(values.repetitions);
if (!Number.isInteger(repetitions) || repetitions < 1 || repetitions > 5) throw new Error('repetitions must be 1..5.');
if (!['commands', 'agents'].includes(values.mode)) throw new Error('mode must be commands or agents.');
if (!['1', '2'].includes(values.jobs)) throw new Error('jobs must be 1 or 2');
if (
  values.scenario &&
  !(values.mode === 'commands' ? ['fresh', 'warm', 'editor'] : ['frontend', 'backend', 'failure']).includes(
    values.scenario,
  )
)
  throw new Error('Unknown scenario');
if (process.version !== 'v24.21.0') throw new Error('Benchmark requires Node 24.21.0.');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const output = path.join(arms.candidate, '.codex-artifacts/validation-benchmark', `${values.mode}-${stamp}`);
await mkdir(output, { recursive: true });
const records = [];
const interruption = new AbortController();
process.on('SIGINT', () => interruption.abort());
process.on('SIGTERM', () => interruption.abort());
async function harnessIdentity() {
  const configRoot = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
  const identity = {};
  for (const file of ['config.toml', 'AGENTS.md', 'policy/token-efficiency.md', 'RTK.md']) {
    const contents = await readFile(path.join(configRoot, file)).catch((error) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    identity[file] = contents ? createHash('sha256').update(contents).digest('hex') : null;
  }
  return identity;
}
const metadata = {
  baseline: arms.baseline,
  candidate: arms.candidate,
  node: process.version,
  pnpm: (await execa('pnpm', ['--version'])).stdout,
  model: values.model,
  effort: values.effort,
  platform: os.platform(),
  release: os.release(),
  cpu: os.cpus()[0]?.model,
  cores: os.cpus().length,
  memoryBytes: os.totalmem(),
  startedAt: new Date().toISOString(),
  repetitions,
  mode: values.mode,
  candidateJobs: Number(values.jobs),
  scenario: values.scenario ?? 'all',
  sandbox: 'workspace-write',
  ephemeral: true,
  harness: await harnessIdentity(),
  rtk: (await execa(values.rtk, ['--version'])).stdout,
  codex: (await execa('codex', ['--version'])).stdout,
};
if (metadata.pnpm !== '12.0.0') throw new Error('Benchmark requires pnpm 12.0.0.');
await writeFile(path.join(output, 'metadata.json'), JSON.stringify(metadata, null, 2));

async function save() {
  await writeFile(path.join(output, 'runs.json'), JSON.stringify(records, null, 2));
  const groups = {};
  for (const run of records.filter((entry) => !entry.priming)) {
    const key = `${run.scenario}/${run.arm}`;
    (groups[key] ??= []).push(run);
  }
  const stats = (items) => {
    if (!items.length) return null;
    items.sort((a, b) => a - b);
    return {
      n: items.length,
      median:
        items.length % 2 ? items[(items.length - 1) / 2] : (items[items.length / 2 - 1] + items[items.length / 2]) / 2,
      p75: items[Math.ceil(items.length * 0.75) - 1],
      p90: items[Math.ceil(items.length * 0.9) - 1],
    };
  };
  await writeFile(
    path.join(output, 'statistics.json'),
    JSON.stringify(
      Object.fromEntries(
        Object.entries(groups).map(([key, runs]) => [
          key,
          {
            elapsedMs: stats(runs.map((run) => run.durationMs).filter(Number.isFinite)),
            totalTokens: stats(
              runs.filter((run) => run.usage).map((run) => run.usage.input_tokens + run.usage.output_tokens),
            ),
            failures: runs.filter((run) => !run.valid).length,
            comparisonEligible: repetitions === 5 && runs.length === repetitions && runs.every((run) => run.valid),
            note: 'All observed trials, including failures. Do not compare groups unless every trial is eligible and transcripts are verified.',
          },
        ]),
      ),
      null,
      2,
    ),
  );
}

const generatedPaths = [
  ...['apps/web', 'apps/staff', 'apps/backend', 'packages/api-client'].flatMap((entry) =>
    ['.astro', 'dist', 'node_modules/.astro', 'node_modules/.vite', 'node_modules/.cache'].map(
      (suffix) => `${entry}/${suffix}`,
    ),
  ),
  'node_modules/.cache',
  'node_modules/.vite',
];
async function fresh(cwd) {
  for (const relative of generatedPaths) {
    const target = path.resolve(cwd, relative);
    if (!target.startsWith(`${cwd}${path.sep}`)) throw new Error('Cleanup escaped benchmark worktree.');
    // Only remove ignored generated paths; a future tracked path must fail closed.
    const ignored = await execa('git', ['check-ignore', '--no-index', relative], { cwd, reject: false });
    const tracked = await execa('git', ['ls-files', '--', relative], { cwd });
    if (tracked.stdout) throw new Error(`Refusing tracked cleanup: ${relative}`);
    if (ignored.exitCode === 0) {
      const resolved = await realpath(target).catch((error) => {
        if (error.code === 'ENOENT') return target;
        throw error;
      });
      if (!resolved.toLowerCase().startsWith(`${cwd}${path.sep}`.toLowerCase()))
        throw new Error('Cleanup resolved outside worktree.');
      await rm(target, { recursive: true, force: true });
    }
  }
}

async function commandRun(arm, scenario, index, priming = false) {
  const cwd = arms[arm];
  if (scenario === 'fresh') await fresh(cwd);
  const record = { arm, scenario, index, priming, sourceBefore: await sourceIdentity(cwd), phases: [] };
  const editorSteps = ['build:staff', 'preview-policy', 'editor-chromium', 'editor-firefox'];
  const gates =
    arm === 'baseline'
      ? scenario === 'editor'
        ? editorSteps
        : ['test:unit', 'check', 'build']
      : [scenario === 'editor' ? 'validate:editor' : 'validate'];
  const started = performance.now();
  records.push(record);
  await save();
  for (const gate of gates) {
    const args =
      gate === 'preview-policy'
        ? ['proxy', process.execPath, 'scripts/test-preview-policy.mjs']
        : gate.startsWith('editor-')
          ? [
              'proxy',
              process.execPath,
              'scripts/test-content-workspace.mjs',
              ...(gate === 'editor-firefox' ? ['--firefox'] : []),
            ]
          : ['pnpm', gate, ...(arm === 'candidate' && scenario !== 'editor' ? ['--jobs', values.jobs] : [])];
    const start = performance.now();
    const logPath = path.join(
      output,
      `${scenario}-${index}-${arm}-${gate.replaceAll(':', '-')}${priming ? '-prime' : ''}.log`,
    );
    const file = await open(logPath, 'w');
    let result;
    try {
      result = await execa(values.rtk, args, {
        cwd,
        reject: false,
        stdio: ['ignore', file.fd, file.fd],
        killDescendants: true,
        cancelSignal: interruption.signal,
        timeout: 20 * 60_000,
      });
    } catch (error) {
      result = { exitCode: error.exitCode ?? 1 };
      record.error = error.message;
    } finally {
      await file.close();
    }
    const content = await readFile(logPath, 'utf8');
    record.phases.push({
      gate,
      command: [values.rtk, ...args],
      exitCode: result.exitCode,
      durationMs: Math.round(performance.now() - start),
      outputBytes: Buffer.byteLength(content),
      testSummaries: content
        .split(/\r?\n/)
        .filter((line) => /(?:Test Files|Tests)\s+\d|^[#ℹ] (?:tests|pass|fail) \d/.test(line)),
      logPath,
    });
    await save();
    if (result.exitCode !== 0) break;
    if (arm === 'candidate') {
      const summaryPath = content.match(/— (.+summary\.json)/)?.[1];
      try {
        if (
          !summaryPath ||
          !path.resolve(summaryPath).startsWith(path.join(cwd, '.codex-artifacts', 'validation') + path.sep)
        )
          throw new Error('Missing candidate validation evidence');
        record.validation = JSON.parse(await readFile(summaryPath, 'utf8'));
      } catch (error) {
        record.error = error.message;
        break;
      }
    }
  }
  record.durationMs = Math.round(performance.now() - started);
  if (scenario === 'editor' && arm === 'baseline') {
    record.browserEvidence = path.join(output, `editor-${index}-baseline-artifacts`);
    await cp(path.join(cwd, '.codex-artifacts/content-workspace'), record.browserEvidence, { recursive: true }).catch(
      (error) => {
        record.error = error.message;
      },
    );
  }
  record.sourceAfter = await sourceIdentity(cwd);
  record.valid =
    !record.error &&
    record.phases.length === gates.length &&
    record.phases.every((phase) => phase.exitCode === 0) &&
    JSON.stringify(record.sourceBefore) === JSON.stringify(record.sourceAfter);
  await save();
  console.log(`${scenario} ${index} ${arm}: ${record.valid ? 'valid' : 'INVALID'} ${record.durationMs}ms`);
  return record.valid;
}

const fixtureFile = (scenario) =>
  scenario === 'frontend'
    ? 'apps/web/src/utils/content.test.ts'
    : 'apps/backend/test/scripts/validation-benchmark-fixture.test.ts';
async function installFixture(cwd, scenario) {
  const filename = path.join(cwd, fixtureFile(scenario));
  const original = await readFile(filename, 'utf8').catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (scenario !== 'frontend' && original !== null) throw new Error('Fixture path already exists.');
  const text =
    scenario === 'frontend'
      ? `${original}\nimport { calculateYearsActive } from './content';\n\nit('counts both endpoint years', () => {\n  expect(calculateYearsActive(2020, 2026)).toBe(7);\n});\n`
      : `import { expect, it } from 'vitest';\n\nit('resolves the store capabilities path', () => {\n  expect(new URL('/api/store/capabilities', 'http://127.0.0.1:8787').pathname).toBe('${scenario === 'failure' ? '/api/wrong' : '/api/store/capabilities'}');\n});\n`;
  await writeFile(filename, text);
  // Formatting is part of fixture setup, outside the timed agent trial.
  await execa('pnpm', ['exec', 'prettier', filename, '--write'], { cwd });
  return async () => {
    if (original === null) await rm(filename);
    else await writeFile(filename, original);
  };
}

async function agentRun(arm, scenario, index) {
  const cwd = arms[arm];
  const restore = await installFixture(cwd, scenario);
  const record = {
    arm,
    scenario,
    index,
    valid: false,
    sourceBefore: await sourceIdentity(cwd),
    harnessBefore: await harnessIdentity(),
  };
  records.push(record);
  await save();
  const started = performance.now();
  try {
    const prompt =
      'This separate benchmark worktree is explicitly authorized. Use Node 24.21.0 and pnpm 12.0.0, available on PATH. Run validation only; do not modify OpenSpec artifacts. ' +
      'Personal policy links resolve under C:/Users/SVall/.codex, not this worktree. Read C:/Users/SVall/.codex/policy/README.md and C:/Users/SVall/.codex/RTK.md; use C:/Users/SVall/.local/bin/rtk.exe to wrap noisy validation commands according to that guide. Select the validation commands from this worktree’s normal instructions. ' +
      (scenario === 'failure'
        ? 'A prepared test change is present. Exercise the repository’s normal validation, diagnose any failure with its file and assertion, and report whether completion is allowed. Do not edit, suppress tests, commit, deploy, or access hosted services. Local generated build outputs are allowed.'
        : 'A prepared regression-test change is present. Follow this repository’s normal implementation validation instructions, exercise the required completion checks, and report whether the tree is ready. Do not edit source, commit, deploy, or access hosted services. Local generated build outputs are allowed.');
    record.transcript = path.join(output, `${scenario}-${index}-${arm}.jsonl`);
    record.prompt = prompt;
    await save();
    const transcript = await open(record.transcript, 'w');
    const errors = await open(`${record.transcript}.stderr.log`, 'w');
    let result;
    try {
      result = await execa(
        'codex',
        [
          'exec',
          '--json',
          '--ephemeral',
          '--sandbox',
          'workspace-write',
          '-m',
          values.model,
          '-c',
          `model_reasoning_effort="${values.effort}"`,
          '-C',
          cwd,
          prompt,
        ],
        {
          cwd,
          reject: false,
          stdio: ['ignore', transcript.fd, errors.fd],
          killDescendants: true,
          cancelSignal: interruption.signal,
          timeout: 20 * 60_000,
        },
      );
    } finally {
      await transcript.close();
      await errors.close();
    }
    record.durationMs = Math.round(performance.now() - started);
    record.exitCode = result.exitCode;
    const events = (await readFile(record.transcript, 'utf8'))
      .split('\n')
      .filter((line) => line.startsWith('{'))
      .map((line) => JSON.parse(line));
    const completed = events.filter((event) => event.type === 'turn.completed');
    if (completed.length && completed.every((event) => event.usage)) {
      record.usage = {};
      for (const event of completed)
        for (const [key, value] of Object.entries(event.usage))
          if (typeof value === 'number') record.usage[key] = (record.usage[key] ?? 0) + value;
    }
    const items = events.filter((event) => event.type === 'item.completed').map((event) => event.item);
    const commands = items.filter((item) => item.type === 'command_execution');
    record.commands = commands.map(({ command, exit_code }) => ({ command, exit_code }));
    record.observedCommandAndMcpCalls = items.filter((item) =>
      ['command_execution', 'mcp_tool_call'].includes(item.type),
    ).length;
    record.explicitLogReadCommands = commands.filter((item) =>
      /(?:Get-Content|read|tail|rg|Select-String).*\.log/i.test(item.command),
    ).length;
    record.final = items.filter((item) => item.type === 'agent_message').at(-1)?.text ?? '';
    record.sourceAfter = await sourceIdentity(cwd);
    record.harnessAfter = await harnessIdentity();
    record.usageAvailable = Number.isFinite(record.usage?.input_tokens) && Number.isFinite(record.usage?.output_tokens);
    record.sourceUnchanged = JSON.stringify(record.sourceBefore) === JSON.stringify(record.sourceAfter);
    record.captureValid =
      result.exitCode === 0 &&
      record.usageAvailable &&
      record.sourceUnchanged &&
      JSON.stringify(record.harnessBefore) === JSON.stringify(record.harnessAfter);
    record.completionGatesPassed = completedGates(record.commands, arm);
    record.fixtureDiagnosed =
      record.final.includes('validation-benchmark-fixture.test.ts') && record.final.includes('/api/wrong');
    record.valid =
      record.captureValid && (scenario === 'failure' ? record.fixtureDiagnosed : record.completionGatesPassed);
    record.measurementLimits =
      'Completed command/MCP events are observable; polling calls and implicit log reads are not separately exposed. Their token/time costs remain included in the whole turn.';
    record.acceptance = 'requires transcript verification of executed gates and reported outcome';
  } catch (error) {
    record.durationMs = Math.round(performance.now() - started);
    record.error = error.message;
  } finally {
    await restore();
    await save();
  }
  console.log(`${scenario} ${index} ${arm}: ${record.valid ? 'captured' : 'INVALID'} ${record.durationMs}ms`);
  return record.valid;
}

// Check both Git roots before any generated-path cleanup or fixture writes.
for (const cwd of Object.values(arms)) {
  const gitRoot = (await execa('git', ['rev-parse', '--show-toplevel'], { cwd })).stdout;
  if (path.resolve(gitRoot).toLowerCase() !== cwd.toLowerCase())
    throw new Error('Arm must be an exact Git worktree root.');
  await access(path.join(cwd, 'node_modules'));
}
console.log(`Evidence: ${output}`);
if (values.mode === 'commands') {
  for (const scenario of values.scenario ? [values.scenario] : ['fresh', 'warm']) {
    if (scenario === 'warm')
      for (const arm of ['baseline', 'candidate']) {
        if (!(await commandRun(arm, scenario, 0, true))) process.exit(1);
      }
    for (let index = 1; index <= repetitions; index++)
      for (const arm of index % 2 ? ['baseline', 'candidate'] : ['candidate', 'baseline']) {
        if (!(await commandRun(arm, scenario, index))) process.exit(1);
      }
  }
} else {
  for (const scenario of ['frontend', 'backend', 'failure'].filter(
    (scenario) => !values.scenario || values.scenario === scenario,
  ))
    for (let index = 1; index <= repetitions; index++) {
      for (const arm of index % 2 ? ['baseline', 'candidate'] : ['candidate', 'baseline']) {
        if (!(await agentRun(arm, scenario, index))) process.exit(1);
      }
    }
}
