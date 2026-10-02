import { createHash, randomBytes } from 'node:crypto';
import { createReadStream, watch } from 'node:fs';
import { mkdir, writeFile, lstat, readlink, unlink, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import { parseArgs, stripVTControlCharacters } from 'node:util';
import { execa } from 'execa';
import { admittedRunEnv, assertValidationAllowed } from './feedback-guard.mjs';
import { appendHistory, loadPolicy } from './feedback-policy.mjs';
import { runFormatCheck } from './format-check.mjs';
import { runFiniteCommand } from './local-process.ts';
import { acquireSlots, createExclusive, liveHolder } from './machine-slots.mjs';

const scopes = ['web', 'staff', 'backend', 'api-client'];

// Nx targetDefaults make workspace:architecture a prerequisite of these project targets.
// --fast/--scope select affected projects; --checks selects all check targets; --resume keeps Nx cache defaults.
// --lint-only selects every lint target, while --editor retains its existing acceptance commands.
export function validationPlan({
  fast = false,
  full = false,
  scope = 'all',
  editor = false,
  checks = false,
  lintOnly = false,
  noCache = false,
  plan = false,
  since,
  bail = true,
} = {}) {
  if ([fast, full, editor, checks, lintOnly].filter(Boolean).length > 1) throw new Error('Choose one validation mode.');
  if ((full || checks) && scope !== 'all') throw new Error('Complete validation cannot be scoped.');
  if (scope !== 'all' && !scopes.includes(scope)) throw new Error(`Unknown scope: ${scope}`);
  if (editor) {
    if (plan || since || scope !== 'all')
      throw new Error('Editor acceptance cannot be combined with --plan, --since, or scoped validation.');
    const env = admittedRunEnv();
    return [
      { name: 'build:staff', command: 'pnpm', args: ['build:staff'] },
      { name: 'preview-policy', command: process.execPath, args: ['scripts/test-preview-policy.mjs'] },
      { name: 'editor-chromium', command: process.execPath, args: ['scripts/test-content-workspace.mjs'], env },
      {
        name: 'editor-firefox',
        command: process.execPath,
        args: ['scripts/test-content-workspace.mjs', '--firefox'],
        env,
      },
    ];
  }
  if (lintOnly && scope !== 'all') throw new Error('Lint-only validation cannot be scoped.');

  const affected = !full && !checks && !lintOnly;
  if (since && !affected) throw new Error('--since is only valid for affected validation.');
  const targets = lintOnly ? ['lint'] : ['test', 'lint', 'typecheck', ...(full ? ['build'] : [])];
  const args = affected ? ['affected', '-t', ...targets] : ['run-many', '-t', ...targets, '--all'];
  // Nx bail kills tasks already running, which then report as failures; CI lets every task report its own result.
  if (bail) args.push('--nxBail');
  if (scope !== 'all') args.push('--exclude=*,!tag:scope:' + scope);
  if (since) args.push('--base=' + since);
  if (plan) args.push('--graph=stdout');
  if (noCache) args.push('--skip-nx-cache');
  return [
    {
      name: affected ? 'affected' : full ? 'full' : lintOnly ? 'lint' : 'checks',
      command: 'pnpm',
      args: ['exec', 'nx', ...args],
    },
  ];
}

/** HEAD plus the status and content of every path git reports as changed or untracked. */
export async function sourceIdentity(cwd) {
  const { stdout: sha } = await execa('git', ['rev-parse', 'HEAD'], { cwd });
  const { stdout } = await execa(
    'git',
    ['--no-optional-locks', 'status', '--porcelain=v1', '-z', '--untracked-files=all'],
    { cwd },
  );
  const fields = stdout.split('\0');
  const hash = createHash('sha256');
  let files = 0;
  for (let index = 0; index < fields.length; index += 1) {
    if (!fields[index]) continue;
    const status = fields[index].slice(0, 2);
    const name = fields[index].slice(3);
    // A rename or copy is followed by its source path.
    const from = /[RC]/.test(status) ? fields[++index] : '';
    const filename = path.join(cwd, name);
    files += 1;
    hash.update(`${name}\0${status}\0${from}\0`);
    try {
      const stat = await lstat(filename);
      hash.update(`${stat.mode & 0o777}\0`);
      if (stat.isSymbolicLink()) hash.update(await readlink(filename));
      else if (stat.isFile()) {
        const fileHash = createHash('sha256');
        for await (const chunk of createReadStream(filename)) fileHash.update(chunk);
        hash.update(fileHash.digest());
      } else hash.update('directory');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      hash.update('deleted');
    }
    hash.update('\0');
  }
  return { sha, fingerprint: hash.digest('hex'), files };
}

/** Existing files changed since the merge base with the affected base, plus untracked files; null without a base. */
export async function changedFiles(cwd, since) {
  const base =
    since ??
    (await readFile(path.join(cwd, 'nx.json'), 'utf8').then(
      (text) => JSON.parse(text).defaultBase,
      () => undefined,
    ));
  const mergeBase = base && (await execa('git', ['merge-base', 'HEAD', base], { cwd, reject: false }));
  if (!mergeBase || mergeBase.exitCode !== 0) return null;
  const changed = await execa('git', ['diff', '--name-only', '-z', '--no-renames', mergeBase.stdout.trim()], { cwd });
  const untracked = await execa('git', ['ls-files', '-z', '--others', '--exclude-standard'], { cwd });
  const files = [];
  for (const name of new Set(`${changed.stdout}\0${untracked.stdout}`.split('\0').filter(Boolean))) {
    const stat = await lstat(path.join(cwd, name)).catch(() => null);
    if (stat?.isFile()) files.push(name);
  }
  return files.sort();
}

/** Format changed files in place before validation records source identity; returns the rewritten files. */
export async function formatChangedFiles(cwd, { since, log = console.log } = {}) {
  const files = await changedFiles(cwd, since);
  if (!files) {
    log('Skipping changed-file formatting: the affected base cannot be resolved.');
    return [];
  }
  const modified = async (name) =>
    (await lstat(path.join(cwd, name), { bigint: true }).catch(() => null))?.mtimeNs ?? null;
  const before = await Promise.all(files.map(modified));
  // Batches keep each Windows command line well under its length limit.
  for (let index = 0; index < files.length; index += 100)
    await runFormatCheck({ cwd, files: files.slice(index, index + 100), write: true });
  const after = await Promise.all(files.map(modified));
  const rewritten = files.filter((_name, index) => before[index] !== after[index]);
  if (rewritten.length) log(`Formatted ${rewritten.length} changed file(s): ${rewritten.join(', ')}`);
  return rewritten;
}

export function diagnosticExcerpt(text) {
  const lines = stripVTControlCharacters(text).split(/\r?\n/);
  const failure = lines.findIndex((line) =>
    /Failed Tests|(?:^|\s)FAIL(?:\s|$)|^not ok \d|\w*Error:|error TS\d|error:|✖/.test(line),
  );
  return lines
    .slice(Math.max(0, failure < 0 ? lines.length - 30 : failure - 2), failure < 0 ? undefined : failure + 28)
    .join('\n')
    .slice(0, 6000);
}

export async function monitorSourceChanges(cwd) {
  const names = (await execa('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd })).stdout
    .split('\0')
    .filter(Boolean);
  const initial = new Map();
  for (const name of names) {
    const stat = await lstat(path.join(cwd, name), { bigint: true }).catch((error) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (stat) initial.set(name, stat);
  }
  const touched = new Set();
  let failure;
  const watcher = watch(cwd, { recursive: true }, (_event, filename) => {
    const name = filename?.toString().replaceAll('\\', '/');
    if (name && !/(^|\/)(?:\.git|\.nx|node_modules|\.codex-artifacts)(\/|$)/.test(name)) touched.add(name);
  });
  watcher.on('error', (error) => {
    failure = error;
  });
  return async () => {
    watcher.close();
    if (failure) throw failure;
    if (!touched.size) return [];
    const ignoredResult = await execa('git', ['check-ignore', '-z', '--stdin'], {
      cwd,
      input: [...touched].join('\0') + '\0',
      reject: false,
    });
    if (![0, 1].includes(ignoredResult.exitCode)) throw new Error('Cannot classify changed source paths.');
    const ignored = new Set(ignoredResult.stdout.split('\0'));
    const tracked = new Set((await execa('git', ['ls-files', '-z'], { cwd })).stdout.split('\0'));
    const source = [];
    for (const name of touched) {
      if (ignored.has(name)) continue;
      const stat = await lstat(path.join(cwd, name), { bigint: true }).catch((error) => {
        if (error.code === 'ENOENT') return null;
        throw error;
      });
      if (!stat && !tracked.has(name) && /(?:^|\/)_tmp_\d+_[0-9a-f]{8}$/.test(name)) continue;
      const before = initial.get(name);
      if (stat && before && stat.mtimeNs === before.mtimeNs && stat.size === before.size && stat.mode === before.mode)
        continue;
      if (!stat?.isDirectory()) source.push(name);
    }
    return source.sort();
  };
}

/**
 * Take this checkout's validation lock, queueing behind a live validation; a lock whose process has exited is
 * reclaimed, and an unparseable one is held briefly because its writer may sit between open and write.
 */
async function acquireLock(lockPath, { signal, log }) {
  const record = JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() });
  let reportAt = 0;
  for (;;) {
    if (await createExclusive(lockPath, record)) return;
    const holder = await liveHolder(lockPath);
    if (!holder) continue;
    if (Date.now() >= reportAt) {
      log(
        `Waiting for the validation already running in this checkout (${holder.pid ? `pid ${holder.pid}` : 'starting'}).`,
      );
      reportAt = Date.now() + loadPolicy().machine.waitReportSeconds * 1000;
    }
    await sleep(250, undefined, { signal });
  }
}

export async function runValidation({
  cwd = process.cwd(),
  options = {},
  signal,
  identify = sourceIdentity,
  runCommand = runFiniteCommand,
  acquire = acquireSlots,
  format = formatChangedFiles,
  history = appendHistory,
  env = process.env,
  log = console.log,
} = {}) {
  const local = env.GITHUB_ACTIONS !== 'true';
  const commands = validationPlan({ ...options, bail: local });
  const affected = !options.full && !options.checks && !options.lintOnly && !options.editor;
  // Nx restores tasks whose inputs did not change, so a second pass costs only what the edit touched.
  const converges = !options.plan && !options.editor;
  const root = path.join(cwd, '.codex-artifacts', 'validation');
  await mkdir(root, { recursive: true });
  const lockPath = path.join(root, 'active.lock');
  // A plan only computes the project graph and writes its own evidence directory, so it never queues behind a run.
  let lockWaitMs = null;
  if (!options.plan) {
    const lockStart = performance.now();
    await acquireLock(lockPath, { signal, log });
    lockWaitMs = Math.round(performance.now() - lockStart);
  }
  // The random suffix keeps runs that start in the same millisecond of one process from sharing an evidence directory.
  const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${process.pid}-${randomBytes(3).toString('hex')}`;
  const evidenceDir = path.join(root, runId);
  const started = performance.now();
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  if (signal?.aborted) cancel();
  const partial = Boolean(
    options.fast || options.checks || options.lintOnly || (options.scope && options.scope !== 'all'),
  );
  const summary = {
    schemaVersion: 1,
    runId,
    mode: options.editor ? 'editor' : options.full ? 'full' : partial ? 'partial' : 'local',
    scope: options.lintOnly ? 'lint' : options.editor ? 'editor' : options.checks ? 'checks' : (options.scope ?? 'all'),
    trace: Boolean(options.trace),
    startedAt: new Date().toISOString(),
    firstFailureDurationMs: null,
    status: 'incomplete',
    exitCode: 1,
    phases: [],
    plannedPhases: commands.map(({ name, command, args }) => ({ name, command, args })),
    node: process.version,
    pnpm: process.env.npm_config_user_agent?.match(/^pnpm\/([^ ]+)/)?.[1] ?? null,
    sourceBefore: null,
    sourceAfter: null,
    sourceChanges: [],
    slots: null,
    lockWaitMs,
    formatted: [],
    passes: 0,
    taskAcceptance: 'not established: browser, CMS, publication, asset and task-specific checks remain additional',
  };
  let stopMonitoring;
  let slots;
  try {
    await mkdir(evidenceDir);
    if (local && !options.plan && !options.editor) {
      const waitStart = performance.now();
      slots = await acquire({ cwd, label: `validate ${commands[0].name}`, signal: controller.signal, log });
      summary.slots = { count: slots.count, waitMs: Math.round(performance.now() - waitStart) };
    }
    if (local && affected && !options.plan)
      summary.formatted = await format(cwd, { since: options.since, log }).catch((error) => {
        log(`Changed-file formatting failed; the format check reports it. ${error.shortMessage ?? error.message}`);
        return [];
      });
    let unchanged;
    for (;;) {
      summary.passes += 1;
      if (identify === sourceIdentity) stopMonitoring = await monitorSourceChanges(cwd);
      summary.sourceBefore = await identify(cwd);
      for (const [index, command] of commands.entries()) {
        const logPath = path.join(evidenceDir, `${index}-${command.name}${summary.passes > 1 ? '-rerun' : ''}.log`);
        await writeFile(logPath, '');
        const phaseStart = performance.now();
        const entry = {
          name: command.name,
          command: command.command,
          args: slots ? [...command.args, `--parallel=${slots.count}`] : command.args,
          logPath,
          status: 'running',
          exitCode: null,
        };
        summary.phases.push(entry);
        try {
          await runCommand(
            {
              ...command,
              args: entry.args,
              env: {
                ...command.env,
                // A daemon started mid-run inherits the piped stdio and keeps the wrapper waiting forever.
                NX_DAEMON: 'false',
                // Plugin workers start slowly on a loaded machine; waiting beats failing the task.
                NX_PLUGIN_NO_TIMEOUTS: 'true',
                BLACKBOX_VALIDATION_REPORT_DIR: evidenceDir,
                BLACKBOX_VALIDATION_TRACE: options.trace ? '1' : undefined,
              },
            },
            {
              cwd,
              logger: () => {},
              stdio: [
                'ignore',
                [{ file: logPath, append: true }, 'inherit'],
                [{ file: logPath, append: true }, 'inherit'],
              ],
              cancelSignal: controller.signal,
            },
          );
          entry.status = 'passed';
          entry.exitCode = 0;
        } catch (error) {
          entry.status = controller.signal.aborted ? 'cancelled' : 'failed';
          entry.exitCode = error.exitCode || 1;
          entry.error = error.message;
          summary.error = error.message;
        }
        const content = await readFile(logPath, 'utf8');
        entry.outputBytes = Buffer.byteLength(content);
        entry.logSha256 = createHash('sha256').update(content).digest('hex');
        entry.diagnostics = diagnosticExcerpt(content);
        entry.durationMs = Math.round(performance.now() - phaseStart);
        entry.testSummaries = content
          .split(/\r?\n/)
          .filter((line) => /(?:Test Files|Tests)\s+\d|^[#ℹ] (?:tests|pass|fail) \d/.test(line));
        if (entry.status !== 'passed') break;
        if (options.plan) break;
      }
      summary.sourceAfter = await identify(cwd);
      summary.sourceChanges = stopMonitoring ? await stopMonitoring() : [];
      stopMonitoring = null;
      unchanged =
        !summary.sourceChanges.length && JSON.stringify(summary.sourceBefore) === JSON.stringify(summary.sourceAfter);
      if (unchanged || !converges || summary.passes > 1 || controller.signal.aborted) break;
      log(
        `Source changed during validation${summary.sourceChanges.length ? ` (${summary.sourceChanges.slice(0, 5).join(', ')})` : ''}; running the same selection once more.`,
      );
      summary.supersededPhases = summary.phases;
      summary.firstPassSourceChanges = summary.sourceChanges;
      summary.phases = [];
      delete summary.error;
    }
    const planned =
      options.plan &&
      unchanged &&
      !controller.signal.aborted &&
      summary.phases.every(({ status }) => status === 'passed');
    const passed =
      summary.phases.length === commands.length && summary.phases.every(({ status }) => status === 'passed');
    summary.status = !unchanged
      ? 'invalidated'
      : planned
        ? 'planned'
        : controller.signal.aborted
          ? 'cancelled'
          : passed
            ? partial
              ? 'partial'
              : 'passed'
            : 'failed';
    summary.exitCode = ['partial', 'passed', 'planned'].includes(summary.status)
      ? 0
      : summary.phases.find(({ status }) => status !== 'passed')?.exitCode || 1;
  } catch (error) {
    summary.error = error.message;
    log(`INCOMPLETE: ${error.message}`);
  } finally {
    if (stopMonitoring) await stopMonitoring().catch(() => {});
    // A slot left behind is reclaimed once this process exits.
    await slots?.release().catch(() => {});
    summary.skippedPhases = commands
      .filter(({ name }) => !summary.phases.some((entry) => entry.name === name))
      .map(({ name }) => name);
    summary.durationMs = Math.round(performance.now() - started);
    summary.endedAt = new Date().toISOString();
    await mkdir(evidenceDir, { recursive: true });
    summary.reports = (await readdir(evidenceDir))
      .filter((name) => name.endsWith('.json'))
      .map((name) => path.join(evidenceDir, name));
    await writeFile(path.join(evidenceDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
    if (local && !options.plan) {
      try {
        await history(
          {
            kind: 'validate',
            mode: summary.mode,
            scope: summary.scope,
            status: summary.status,
            durationMs: summary.durationMs,
            nxMs: summary.phases.reduce((total, phase) => total + (phase.durationMs ?? 0), 0),
            slotCount: summary.slots?.count ?? null,
            slotWaitMs: summary.slots?.waitMs ?? null,
            lockWaitMs: summary.lockWaitMs,
            passes: summary.passes,
            formatted: summary.formatted.length,
          },
          { cwd },
        );
      } catch {
        // The history is advisory: failing to record never changes the run's result.
      }
    }
    signal?.removeEventListener('abort', cancel);
    if (!options.plan) await unlink(lockPath);
  }
  log(
    `${summary.status.toUpperCase()} ${(summary.durationMs / 1000).toFixed(1)}s — ${path.join(evidenceDir, 'summary.json')}`,
  );
  log(`Repository gates only. ${summary.taskAcceptance}`);
  return summary;
}

export async function main(args = process.argv.slice(2), dependencies = {}) {
  const { values } = parseArgs({
    args: args.filter((arg) => arg !== '--'),
    options: {
      fast: { type: 'boolean' },
      full: { type: 'boolean' },
      editor: { type: 'boolean' },
      checks: { type: 'boolean' },
      'lint-only': { type: 'boolean' },
      trace: { type: 'boolean' },
      resume: { type: 'boolean' },
      'no-cache': { type: 'boolean' },
      plan: { type: 'boolean' },
      scope: { type: 'string' },
      since: { type: 'string' },
    },
  });
  const options = {
    fast: values.fast,
    full: values.full,
    editor: values.editor,
    checks: values.checks,
    lintOnly: values['lint-only'],
    noCache: values['no-cache'],
    plan: values.plan,
    scope: values.scope,
    since: values.since,
    trace: values.trace,
  };
  // Release-tier modes refuse here too, so invoking this file directly with node cannot skip the package.json guard.
  assertValidationAllowed(args, {
    env: dependencies.env ?? process.env,
    cwd: dependencies.cwd ?? process.cwd(),
  });
  const controller = new AbortController();
  const cancel = () => controller.abort();
  const signal = dependencies.signal ?? controller.signal;
  if (!dependencies.signal) {
    process.on('SIGINT', cancel);
    process.on('SIGTERM', cancel);
  }
  try {
    return await runValidation({ ...dependencies, options, signal });
  } finally {
    if (!dependencies.signal) {
      process.off('SIGINT', cancel);
      process.off('SIGTERM', cancel);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main()
    .then(({ exitCode }) => {
      process.exitCode = exitCode;
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
