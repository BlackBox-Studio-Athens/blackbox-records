import { createHash } from 'node:crypto';
import { createReadStream, watch } from 'node:fs';
import { mkdir, writeFile, lstat, readlink, open, unlink, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs, stripVTControlCharacters } from 'node:util';
import { execa } from 'execa';
import { runFiniteCommand } from './local-process.ts';

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
} = {}) {
  if ([fast, full, editor, checks, lintOnly].filter(Boolean).length > 1) throw new Error('Choose one validation mode.');
  if ((full || checks) && scope !== 'all') throw new Error('Complete validation cannot be scoped.');
  if (scope !== 'all' && !scopes.includes(scope)) throw new Error(`Unknown scope: ${scope}`);
  if (editor) {
    if (plan || since || scope !== 'all')
      throw new Error('Editor acceptance cannot be combined with --plan, --since, or scoped validation.');
    return [
      { name: 'build:staff', command: 'pnpm', args: ['build:staff'] },
      { name: 'preview-policy', command: process.execPath, args: ['scripts/test-preview-policy.mjs'] },
      { name: 'editor-chromium', command: process.execPath, args: ['scripts/test-content-workspace.mjs'] },
      { name: 'editor-firefox', command: process.execPath, args: ['scripts/test-content-workspace.mjs', '--firefox'] },
    ];
  }
  if (lintOnly && scope !== 'all') throw new Error('Lint-only validation cannot be scoped.');

  const affected = !full && !checks && !lintOnly;
  if (since && !affected) throw new Error('--since is only valid for affected validation.');
  const targets = lintOnly ? ['lint'] : ['test', 'lint', 'typecheck', ...(full ? ['build'] : [])];
  const args = affected ? ['affected', '-t', ...targets] : ['run-many', '-t', ...targets, '--all'];
  args.push('--nxBail');
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

export async function sourceIdentity(cwd) {
  const { stdout: sha } = await execa('git', ['rev-parse', 'HEAD'], { cwd });
  const { stdout } = await execa('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd });
  const names = [...new Set(stdout.split('\0').filter(Boolean))].sort();
  const hash = createHash('sha256');
  for (const name of names) {
    const filename = path.join(cwd, name);
    hash.update(`${name}\0`);
    try {
      const stat = await lstat(filename);
      hash.update(`${stat.mode & 0o777}\0`);
      if (stat.isSymbolicLink()) hash.update(await readlink(filename));
      else if (stat.isFile()) {
        const fileHash = createHash('sha256');
        for await (const chunk of createReadStream(filename)) fileHash.update(chunk);
        hash.update(fileHash.digest());
      } else throw new Error(`Unsupported source entry: ${name}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      hash.update('deleted');
    }
    hash.update('\0');
  }
  return { sha, fingerprint: hash.digest('hex'), files: names.length };
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

function processAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code !== 'ESRCH';
  }
}

async function acquireLock(lockPath) {
  try {
    return await open(lockPath, 'wx');
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const pid = Number((await readFile(lockPath, 'utf8').catch(() => '')).trim());
    const owner = Number.isSafeInteger(pid) && pid > 0 ? pid : null;
    // An unparseable lock is not stolen: its writer may sit between open and the PID write.
    if (owner === null || processAlive(owner)) {
      throw new Error(
        `Validation lock ${lockPath} is held by ${owner === null ? 'unknown owner' : `PID ${owner}`}; delete it if that process is gone.`,
        { cause: error },
      );
    }
    await unlink(lockPath).catch((unlinkError) => {
      if (unlinkError.code !== 'ENOENT') throw unlinkError;
    });
    return open(lockPath, 'wx');
  }
}

export async function runValidation({
  cwd = process.cwd(),
  options = {},
  signal,
  identify = sourceIdentity,
  runCommand = runFiniteCommand,
  log = console.log,
} = {}) {
  const commands = validationPlan(options);
  const root = path.join(cwd, '.codex-artifacts', 'validation');
  await mkdir(root, { recursive: true });
  const lockPath = path.join(root, 'active.lock');
  const lock = await acquireLock(lockPath);
  const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${process.pid}`;
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
    taskAcceptance: 'not established: browser, CMS, publication, asset and task-specific checks remain additional',
  };
  let stopMonitoring;
  try {
    await lock.writeFile(String(process.pid));
    await mkdir(evidenceDir);
    if (identify === sourceIdentity) stopMonitoring = await monitorSourceChanges(cwd);
    summary.sourceBefore = await identify(cwd);
    for (const [index, command] of commands.entries()) {
      const logPath = path.join(evidenceDir, `${index}-${command.name}.log`);
      await writeFile(logPath, '');
      const phaseStart = performance.now();
      const entry = {
        name: command.name,
        command: command.command,
        args: command.args,
        logPath,
        status: 'running',
        exitCode: null,
      };
      summary.phases.push(entry);
      try {
        await runCommand(
          {
            ...command,
            env: {
              ...command.env,
              // A daemon started mid-run inherits the piped stdio and keeps the wrapper waiting forever.
              NX_DAEMON: 'false',
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
      const content = await import('node:fs/promises').then(({ readFile }) => readFile(logPath, 'utf8'));
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
    const unchanged =
      !summary.sourceChanges.length && JSON.stringify(summary.sourceBefore) === JSON.stringify(summary.sourceAfter);
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
    signal?.removeEventListener('abort', cancel);
    await lock.close();
    await unlink(lockPath);
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
