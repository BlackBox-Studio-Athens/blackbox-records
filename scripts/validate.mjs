import { createHash } from 'node:crypto';
import { createReadStream, watch } from 'node:fs';
import { mkdir, readFile, writeFile, lstat, readlink, open, unlink, readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs, stripVTControlCharacters } from 'node:util';
import { execa } from 'execa';
import { runFiniteCommand } from './local-process.ts';

export function validationPlan({ fast = false, scope = 'all', editor = false } = {}) {
  if (!['all', 'web', 'staff', 'backend', 'api-client'].includes(scope)) throw new Error(`Unknown scope: ${scope}`);
  if (!fast && scope !== 'all') throw new Error('Full validation cannot be scoped.');
  const phase = (name, args) => ({ name, command: 'pnpm', args });
  if (editor) {
    if (fast || scope !== 'all') throw new Error('Editor acceptance cannot be combined with scoped iteration.');
    return [
      phase('build:staff', ['build:staff']),
      ...[
        ['preview-policy', ['scripts/test-preview-policy.mjs']],
        ['editor-chromium', ['scripts/test-content-workspace.mjs']],
        ['editor-firefox', ['scripts/test-content-workspace.mjs', '--firefox']],
      ].map(([name, args]) => ({ name, command: process.execPath, args })),
    ];
  }
  if (!fast) {
    return [
      'test:unit',
      'environment:model:verify',
      'format:check',
      'lint',
      'check:types',
      'check:boundaries',
      'build',
    ].map((name) => phase(name, [name]));
  }
  const filters = scope === 'all' ? ['web', 'staff', 'backend', 'api-client'] : [scope];
  const selection = filters.flatMap((name) => ['--filter', `@blackbox/${name}`]);
  return [
    phase('tests', ['--parallel', ...selection, 'test']),
    phase('types', ['--parallel', ...selection, 'check']),
    phase('contracts', ['test:contracts']),
  ];
}

export async function sourceIdentity(cwd) {
  const { stdout: sha } = await execa('git', ['rev-parse', 'HEAD'], { cwd });
  const { stdout } = await execa('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd });
  const names = [...new Set(stdout.split('\0').filter(Boolean))].sort();
  const hash = createHash('sha256');
  // Include tracked generated source; only ignored validation outputs are excluded by Git.
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
  const first = lines.findIndex((line) =>
    /(?:^|\s)(?:FAIL(?:ED)?(?:\s|$)|\w*Error:|error TS\d|error:|✖)|\d+:\d+\s+error/.test(line),
  );
  return lines
    .slice(Math.max(0, first < 0 ? lines.length - 30 : first - 2), first < 0 ? undefined : first + 28)
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
    if (name && !/(^|\/)(?:\.git|node_modules|\.codex-artifacts)(\/|$)/.test(name)) touched.add(name);
  });
  watcher.on('error', (error) => {
    failure = error;
  });
  return async () => {
    watcher.close();
    if (failure) throw failure;
    if (!touched.size) return [];
    const result = await execa('git', ['check-ignore', '-z', '--stdin'], {
      cwd,
      input: [...touched].join('\0') + '\0',
      reject: false,
    });
    if (![0, 1].includes(result.exitCode)) throw new Error('Cannot classify changed source paths.');
    const ignored = new Set(result.stdout.split('\0'));
    const tracked = new Set((await execa('git', ['ls-files', '-z'], { cwd })).stdout.split('\0'));
    const source = [];
    for (const name of touched) {
      if (ignored.has(name)) continue;
      const stat = await lstat(path.join(cwd, name), { bigint: true }).catch((error) => {
        if (error.code === 'ENOENT') return null;
        throw error;
      });
      // pnpm creates and removes extensionless _tmp_<pid>_<hex> filesystem probes.
      // Never exclude a surviving file, or a tracked file with a matching name.
      if (!stat && !tracked.has(name) && /(?:^|\/)_tmp_\d+_[0-9a-f]{8}$/.test(name)) continue;
      const before = initial.get(name);
      // Windows can notify on access/attribute activity. Reads are not source edits.
      if (stat && before && stat.mtimeNs === before.mtimeNs && stat.size === before.size && stat.mode === before.mode)
        continue;
      if (!stat?.isDirectory()) source.push(name);
    }
    return source.sort();
  };
}

export async function runValidation({
  cwd = process.cwd(),
  fast = false,
  editor = false,
  trace = false,
  scope = 'all',
  jobs = 2,
  signal,
  phases = validationPlan({ fast, scope, editor }),
  identify = sourceIdentity,
  readPnpmVersion = async () => (await execa('pnpm', ['--version'], { cwd })).stdout,
  log = console.log,
} = {}) {
  if (![1, 2].includes(jobs)) throw new Error('jobs must be 1 or 2.');
  const root = path.join(cwd, '.codex-artifacts', 'validation');
  await mkdir(root, { recursive: true });
  const lockPath = path.join(root, 'active.lock');
  // ponytail: one invocation per worktree; isolate worktrees for concurrent validation.
  const lock = await open(lockPath, 'wx');
  const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${process.pid}`;
  const evidenceDir = path.join(root, runId);
  const started = performance.now();
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  if (signal?.aborted) cancel();
  const summary = {
    schemaVersion: 1,
    runId,
    mode: fast || editor ? 'partial' : 'full',
    scope: editor ? 'editor' : scope,
    jobs,
    trace,
    startedAt: new Date().toISOString(),
    status: 'incomplete',
    exitCode: 1,
    phases: [],
    plannedPhases: phases.map(({ name, command, args }) => ({ name, command, args })),
    node: process.version,
    pnpm: null,
    sourceBefore: null,
    sourceAfter: null,
    taskAcceptance:
      'not established: browser, CMS, publication, asset and other task-specific checks remain additional',
  };
  let stopMonitoring;
  try {
    await lock.writeFile(String(process.pid));
    await mkdir(evidenceDir);
    if (identify === sourceIdentity) stopMonitoring = await monitorSourceChanges(cwd);
    summary.sourceBefore = await identify(cwd);
    summary.pnpm = await readPnpmVersion();
    if (process.version !== 'v24.20.0' || summary.pnpm !== '12.0.0')
      throw new Error('Validation requires Node 24.20.0 and pnpm 12.0.0.');
    if (fast || editor) log('PARTIAL validation: this does not establish implementation completion.');
    async function execute(phase) {
      const phaseStart = performance.now();
      const logPath = path.join(evidenceDir, `${summary.phases.length}-${phase.name.replaceAll(':', '-')}.log`);
      const entry = {
        name: phase.name,
        command: phase.command,
        args: phase.args,
        logPath,
        status: 'running',
        exitCode: null,
      };
      summary.phases.push(entry);
      const output = await open(logPath, 'w');
      try {
        if (controller.signal.aborted) throw new Error('Validation cancelled.');
        const command = {
          ...phase,
          env: {
            ...phase.env,
            BLACKBOX_VALIDATION_REPORT_DIR: evidenceDir,
            BLACKBOX_VALIDATION_TRACE: trace ? '1' : undefined,
          },
        };
        if (phase.name === 'lint' && phase.command === 'pnpm') {
          command.args = [
            'exec',
            'eslint',
            '.',
            '--max-warnings=0',
            '--stats',
            '--format',
            'json',
            '--output-file',
            path.join(evidenceDir, 'eslint.json'),
          ];
          entry.args = command.args;
        }
        await runFiniteCommand(command, {
          cwd,
          logger: () => {},
          stdio: ['ignore', output.fd, output.fd],
          cancelSignal: controller.signal,
        });
        entry.exitCode = 0;
        entry.status = 'passed';
      } catch (error) {
        entry.exitCode = error.exitCode || 1;
        entry.error = error.message;
        entry.status = controller.signal.aborted ? 'cancelled' : 'failed';
      } finally {
        await output.close();
      }
      entry.durationMs = Math.round(performance.now() - phaseStart);
      const content = await readFile(logPath, 'utf8');
      entry.outputBytes = Buffer.byteLength(content);
      if (phase.name === 'lint') {
        const reportPath = path.join(evidenceDir, 'eslint.json');
        const report = await readFile(reportPath, 'utf8').catch((error) => {
          if (error.code === 'ENOENT') return null;
          throw error;
        });
        if (report) {
          entry.reportPath = reportPath;
          entry.diagnostics = JSON.parse(report)
            .flatMap(({ filePath, messages }) =>
              messages.map(
                (message) =>
                  `${filePath}:${message.line}:${message.column} ${message.ruleId || 'parse'}: ${message.message}`,
              ),
            )
            .slice(0, 15);
        }
      }
      entry.testSummaries = stripVTControlCharacters(content)
        .split(/\r?\n/)
        .filter((line) => /(?:Test Files|Tests)\s+\d|^[#ℹ] (?:tests|pass|fail) \d/.test(line));
      log(`${entry.status.toUpperCase()} ${phase.name} ${(entry.durationMs / 1000).toFixed(1)}s`);
      if (entry.status !== 'passed') {
        log(
          `Exit code: ${entry.exitCode}\n${diagnosticExcerpt(entry.diagnostics?.join('\n') || content || entry.error || '')}\nLog: ${logPath}`,
        );
      }
      return entry.status === 'passed';
    }
    async function sequence(items) {
      for (const phase of items) if (!(await execute(phase))) return false;
      return true;
    }
    let passed;
    if (jobs === 2 && !fast && !editor && phases.length === 7) {
      const results = await Promise.allSettled([execute(phases[0]), sequence(phases.slice(1, -1))]);
      const rejected = results.find((result) => result.status === 'rejected');
      if (rejected) throw rejected.reason;
      passed = results.every((result) => result.value === true);
      if (passed) passed = await execute(phases.at(-1));
    } else {
      passed = await sequence(phases);
    }
    summary.sourceAfter = await identify(cwd);
    summary.sourceChanges = stopMonitoring ? await stopMonitoring() : [];
    stopMonitoring = null;
    const unchanged =
      !summary.sourceChanges.length && JSON.stringify(summary.sourceBefore) === JSON.stringify(summary.sourceAfter);
    summary.status = controller.signal.aborted
      ? 'cancelled'
      : !unchanged
        ? 'invalidated'
        : passed
          ? fast || editor
            ? 'partial'
            : 'passed'
          : 'failed';
    summary.exitCode =
      passed && unchanged && !controller.signal.aborted
        ? 0
        : summary.phases.find((entry) => entry.exitCode)?.exitCode || 1;
  } catch (error) {
    summary.error = error.message;
    log(`INCOMPLETE: ${error.message}`);
  } finally {
    if (stopMonitoring) await stopMonitoring().catch(() => {});
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

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  process.on('SIGINT', cancel);
  process.on('SIGTERM', cancel);
  try {
    const args = process.argv.slice(2).filter((arg) => arg !== '--');
    const { values } = parseArgs({
      args,
      options: {
        fast: { type: 'boolean' },
        editor: { type: 'boolean' },
        trace: { type: 'boolean' },
        scope: { type: 'string' },
        jobs: { type: 'string' },
      },
    });
    const summary = await runValidation({
      fast: values.fast,
      editor: values.editor,
      trace: values.trace,
      scope: values.scope,
      jobs: Number(values.jobs || 2),
      signal: controller.signal,
    });
    process.exitCode = summary.exitCode;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    process.off('SIGINT', cancel);
    process.off('SIGTERM', cancel);
  }
}
