import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  categorize,
  parseSince,
  readJsonLines,
  readTaskHistory,
  renderReport,
  summarizeDenials,
  summarizeHistory,
  summarizeTimeline,
} from './feedback-report.mjs';

const script = fileURLToPath(new URL('./feedback-report.mjs', import.meta.url));
const directory = mkdtempSync(path.join(tmpdir(), 'feedback-report-'));
after(() => rmSync(directory, { recursive: true, force: true }));

const T0 = Date.parse('2026-09-29T00:00:00.000Z');
const run = (project, target, status, startSeconds, seconds, configuration = null) => ({
  project,
  target,
  configuration,
  status,
  start: T0 + startSeconds * 1000,
  end: T0 + Math.round((startSeconds + seconds) * 1000),
});
const history = [
  run('workspace', 'test-tooling', 'success', 0, 30),
  run('workspace', 'test-tooling', 'stopped', 100, 10),
  run('workspace', 'format', 'failure', 200, 2),
  run('workspace', 'format', 'failure', 300, 2),
  run('app-shell', 'test', 'success', 400, 20),
  run('app-shell', 'test', 'local-cache-kept-existing', 500, 0),
  run('web-tooling', 'test', 'local-cache', 600, 0),
  run('architecture-tests', 'test', 'remote-cache', 700, 0),
  run('@blackbox/web', 'lint', 'success', 800, 0.2),
  run('@blackbox/web', 'lint', 'success', 900, 3.8),
  run('@blackbox/web', 'typecheck', 'success', 1000, 12),
  run('@blackbox/web', 'build', 'skipped', 1100, 0),
  run('@blackbox/staff', 'build', 'success', 1200, 6, 'production'),
  run('staff-orders', 'test-watch', 'stopped', 1300, 14),
];

function createDatabase(name, rows) {
  const databasePath = path.join(directory, name);
  const database = new DatabaseSync(databasePath);
  database.exec(`
    CREATE TABLE task_details (hash TEXT PRIMARY KEY NOT NULL, project TEXT NOT NULL, target TEXT NOT NULL, configuration TEXT);
    CREATE TABLE task_history (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, hash TEXT NOT NULL, status TEXT NOT NULL,
      code INTEGER NOT NULL, start TIMESTAMP NOT NULL, end TIMESTAMP NOT NULL);
  `);
  const detail = database.prepare('INSERT OR IGNORE INTO task_details VALUES (?, ?, ?, ?)');
  const entry = database.prepare('INSERT INTO task_history (hash, status, code, start, end) VALUES (?, ?, ?, ?, ?)');
  for (const { project, target, configuration, status, start, end } of rows) {
    const hash = `${project}|${target}|${configuration}`;
    detail.run(hash, project, target, configuration);
    entry.run(hash, status, status === 'failure' ? 1 : 0, start, end);
  }
  database.close();
  return databasePath;
}

function writeLines(name, lines) {
  const file = path.join(directory, name);
  writeFileSync(file, `${lines.map((line) => (typeof line === 'string' ? line : JSON.stringify(line))).join('\n')}\n`);
  return file;
}

const validation = (time, status, durationMs, slotWaitMs, passes = 1) => ({
  time,
  checkout: 'blackbox-records',
  kind: 'validate',
  mode: 'local',
  scope: 'all',
  status,
  durationMs,
  nxMs: durationMs - 1000,
  slotCount: 2,
  slotWaitMs,
  lockWaitMs: 0,
  passes,
  formatted: [],
});
const denial = (time, rule, checkout = 'blackbox-records') => ({ time, checkout, kind: 'denial', rule, session: 's' });
const e2e = (time, durationMs) => ({
  time,
  checkout: 'blackbox-records',
  kind: 'e2e',
  filter: null,
  exitCode: 0,
  durationMs,
});
const historyLines = [
  validation('2026-09-27T23:59:59.000Z', 'passed', 60_000, 0),
  denial('2026-09-25T08:00:00.000Z', 'pnpm-filter-suite'),
  '{"time":"2026-09-28T01:00:00.000Z","kind":"validate"',
  '',
  { kind: 'e2e', exitCode: 0, durationMs: 1000 },
  validation('2026-09-28T00:00:00.000Z', 'passed', 100_000, 2_000),
  validation('2026-09-29T12:00:00.000Z', 'failed', 200_000, 4_000, 2),
  validation('2026-09-30T12:00:00.000Z', 'partial', 300_000, 6_000),
  validation('2026-10-01T12:00:00.000Z', 'cancelled', 400_000, null),
  denial('2026-09-29T13:00:00.000Z', 'forge-nx-task', 'blackbox-x4'),
  denial('2026-09-30T13:00:00.000Z', 'pnpm-filter-suite'),
  e2e('2026-09-29T14:00:00.000Z', 30_000),
  e2e('2026-09-30T14:00:00.000Z', 50_000),
];
const noExtras = {
  denials: { log: 'denials.jsonl', total: 0, rules: [] },
  timeline: { history: 'history.jsonl', skippedLines: 0, weeks: [] },
};

// Nx sets FORCE_COLOR; beside an agent shell's NO_COLOR, Node warns on stderr before the CLI writes anything.
const childEnv = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !['FORCE_COLOR', 'NO_COLOR'].includes(name)),
);
const absent = path.join(directory, 'absent.jsonl');
// Later --denials and --history arguments win, and no run reads this checkout's real logs.
const cli = (...args) =>
  spawnSync(process.execPath, [script, '--denials', absent, '--history', absent, ...args], {
    encoding: 'utf8',
    env: childEnv,
    windowsHide: true,
    timeout: 30_000,
  });

test('categorizes root, tooling, package and module tasks', () => {
  const cases = [
    ['workspace', 'lint', 'workspace'],
    ['workspace', 'test-tooling', 'workspace'],
    ['backend-tooling', 'test', 'tooling tests'],
    ['architecture-tests', 'test', 'tooling tests'],
    ['@blackbox/web', 'lint', 'package lint'],
    ['@blackbox/backend', 'typecheck', 'typecheck'],
    ['@blackbox/staff', 'build', 'build'],
    ['app-shell', 'test', 'module tests'],
    ['@blackbox/api-client', 'test', 'module tests'],
    ['staff-orders', 'test-watch', 'watch'],
    ['web-pages', 'serve', 'other'],
  ];
  for (const [project, target, category] of cases) assert.equal(categorize({ project, target }), category, project);
});

test('summarizes executed time, cache hits, failures and the contention ratio', () => {
  const summary = summarizeHistory(history, { top: 3 });
  assert.equal(summary.executedTasks, 10);
  assert.equal(summary.executedSeconds, 100);
  assert.equal(summary.cacheHits, 3);
  assert.deepEqual(summary.period, { from: '2026-09-29T00:00:00.000Z', to: '2026-09-29T00:21:54.000Z' });
  assert.deepEqual(
    Object.fromEntries(summary.categories.map(({ category, seconds, share }) => [category, [seconds, share]])),
    {
      workspace: [44, 0.44],
      'module tests': [20, 0.2],
      watch: [14, 0.14],
      typecheck: [12, 0.12],
      build: [6, 0.06],
      'package lint': [4, 0.04],
    },
  );
  assert.deepEqual(summary.failures, [{ task: 'workspace:format', failures: 2 }]);
  assert.deepEqual(
    summary.slowest.map(({ task }) => task),
    ['workspace:test-tooling', 'app-shell:test', 'staff-orders:test-watch'],
  );
  assert.deepEqual(summary.slowest[0], {
    task: 'workspace:test-tooling',
    runs: 2,
    totalSeconds: 40,
    minSeconds: 30,
    averageSeconds: 20,
    averageOverMin: 20 / 30,
  });
  assert.ok(summarizeHistory(history).slowest.some(({ task }) => task === '@blackbox/staff:build:production'));
});

test('takes the contention minimum from successful runs of at least one second', () => {
  const [tested, failing, noOp] = summarizeHistory([
    run('cms-runtime', 'test', 'success', 0, 0.2),
    run('cms-runtime', 'test', 'failure', 10, 2),
    run('cms-runtime', 'test', 'stopped', 20, 1.5),
    run('cms-runtime', 'test', 'success', 30, 4),
    run('cms-runtime', 'test', 'success', 40, 17.3),
    run('workspace', 'format', 'failure', 60, 2),
    run('workspace', 'format', 'stopped', 70, 1.5),
    run('@blackbox/web', 'lint', 'success', 80, 0.3),
  ]).slowest;
  assert.deepEqual(tested, {
    task: 'cms-runtime:test',
    runs: 5,
    totalSeconds: 25,
    minSeconds: 4,
    averageSeconds: 5,
    averageOverMin: 1.25,
  });
  assert.deepEqual([failing.task, failing.minSeconds, failing.averageOverMin], ['workspace:format', null, null]);
  assert.deepEqual([noOp.task, noOp.minSeconds, noOp.averageOverMin], ['@blackbox/web:lint', null, null]);
});

test('parses absolute and relative --since values', () => {
  const now = Date.parse('2026-10-01T12:00:00.000Z');
  assert.equal(parseSince(undefined, now), 0);
  assert.equal(parseSince('2d', now), Date.parse('2026-09-29T12:00:00.000Z'));
  assert.equal(parseSince('6h', now), Date.parse('2026-10-01T06:00:00.000Z'));
  assert.equal(parseSince('2026-09-30', now), Date.parse('2026-09-30T00:00:00.000Z'));
  assert.throws(() => parseSince('last week', now), /--since expects/);
});

test('reads the task database read-only and filters by start time', () => {
  const databasePath = createDatabase('history.db', history);
  assert.equal(readTaskHistory(databasePath).length, history.length);
  const recent = readTaskHistory(databasePath, T0 + 1000 * 1000);
  assert.deepEqual(
    recent.map(({ project, target }) => `${project}:${target}`),
    ['@blackbox/web:typecheck', '@blackbox/web:build', '@blackbox/staff:build', 'staff-orders:test-watch'],
  );

  const denialLog = writeLines('denials.jsonl', [
    { time: '2026-09-29T00:10:00.000Z', rule: 'pnpm-filter-suite', session: 's', command: 'pnpm -r test' },
    { time: '2026-09-29T00:17:00.000Z', rule: 'forge-nx-task', session: 's', command: 'pnpm test' },
    { time: '2026-09-29T00:18:00.000Z', rule: 'pnpm-filter-suite', session: 's', command: 'pnpm -r test' },
    { time: '2026-09-29T00:19:00.000Z', rule: 'pnpm-filter-suite', session: 's', command: 'pnpm -r test' },
  ]);
  const historyFile = writeLines('history.jsonl', historyLines);
  const result = cli(
    ...['--database', databasePath, '--denials', denialLog, '--history', historyFile],
    ...['--since', '2026-09-29T00:16:00.000Z', '--json'],
  );
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.since, '2026-09-29T00:16:00.000Z');
  assert.equal(report.summary.executedTasks, 3);
  assert.equal(report.summary.executedSeconds, 32);
  assert.deepEqual(report.denials, {
    log: denialLog,
    total: 3,
    rules: [
      { rule: 'pnpm-filter-suite', denials: 2 },
      { rule: 'forge-nx-task', denials: 1 },
    ],
  });
  assert.equal(report.timeline.history, historyFile);
  assert.equal(report.timeline.skippedLines, 2);
  assert.deepEqual(
    report.timeline.weeks.map(({ week, validations, denials }) => [week, validations.count, denials]),
    [['2026-09-28', 3, 2]],
  );
});

test('groups the machine-wide history by UTC ISO week and skips unparseable lines', () => {
  const { entries, skippedLines } = readJsonLines(writeLines('weeks.jsonl', historyLines));
  assert.equal(skippedLines, 2, 'a truncated line and an undated line');
  const weeks = summarizeTimeline(entries);
  assert.deepEqual(weeks, [
    {
      week: '2026-09-21',
      validations: {
        count: 1,
        passedShare: 1,
        medianSeconds: 60,
        p75Seconds: 60,
        medianSlotWaitSeconds: 0,
        secondPasses: 0,
      },
      denials: 1,
      e2e: { count: 0, medianSeconds: null },
    },
    {
      week: '2026-09-28',
      validations: {
        count: 4,
        passedShare: 0.5,
        medianSeconds: 250,
        p75Seconds: 325,
        medianSlotWaitSeconds: 4,
        secondPasses: 1,
      },
      denials: 2,
      e2e: { count: 2, medianSeconds: 40 },
    },
  ]);
  const text = renderReport({
    database: 'x.db',
    since: null,
    summary: summarizeHistory([]),
    denials: { log: 'denials.jsonl', ...summarizeDenials([denial('2026-09-29T13:00:00.000Z', 'forge-nx-task')]) },
    timeline: { history: 'history.jsonl', skippedLines, weeks },
  });
  assert.match(text, /Denials: 1\n\n\| Rule \| Denials \|\n\| --- \| ---: \|\n\| forge-nx-task \| 1 \|/);
  assert.match(text, /Skipped unparseable lines: 2/);
  assert.match(text, /\| 2026-09-21 \| 1 \| 100\.0% \| 60\.0 s \| 60\.0 s \| 0\.0 s \| 0 \| 1 \| 0 \| — \|/);
  assert.match(text, /\| 2026-09-28 \| 4 \| 50\.0% \| 250\.0 s \| 325\.0 s \| 4\.0 s \| 1 \| 2 \| 2 \| 40\.0 s \|/);

  const recent = readJsonLines(path.join(directory, 'weeks.jsonl'), Date.parse('2026-09-28T00:00:00.000Z'));
  assert.deepEqual(
    summarizeTimeline(recent.entries).map(({ week }) => week),
    ['2026-09-28'],
  );
});

test('treats a missing or empty history file as no history', () => {
  assert.deepEqual(readJsonLines(path.join(directory, 'missing.jsonl')), { entries: [], skippedLines: 0 });
  assert.deepEqual(readJsonLines(writeLines('blank.jsonl', [])), { entries: [], skippedLines: 0 });
  assert.deepEqual(summarizeTimeline([]), []);
  assert.deepEqual(summarizeDenials([]), { total: 0, rules: [] });
});

test('reports an empty history without failing', () => {
  const summary = summarizeHistory([]);
  assert.deepEqual(summary, {
    period: null,
    executedTasks: 0,
    executedSeconds: 0,
    cacheHits: 0,
    categories: [],
    failures: [],
    slowest: [],
  });
  assert.match(renderReport({ database: 'x.db', since: null, summary, ...noExtras }), /No task history recorded/);

  const result = cli('--database', createDatabase('empty.db', []));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /No task history recorded in this period\./);
  assert.match(result.stdout, /## Guard denials\n\nLog: .*absent\.jsonl\nDenials: 0\n/);
  assert.match(result.stdout, /## Timeline\n\nHistory: .*absent\.jsonl\n\nNo history yet\.\n$/);
});

test('renders the text report', () => {
  const text = renderReport({ database: 'x.db', since: null, summary: summarizeHistory(history), ...noExtras });
  assert.match(text, /Executed tasks: 10 \(100 task-seconds\)/);
  assert.match(text, /Cache hits: 3/);
  assert.match(text, /Min: fastest successful run of at least 1 s/);
  assert.match(text, /\| workspace \| 44 \| 44\.0% \|/);
  assert.match(text, /\| workspace:test-tooling \| 2 \| 40\.0 s \| 30\.0 s \| 20\.0 s \| 0\.7 \|/);
  assert.match(text, /\| workspace:format \| 2 \| 4\.0 s \| — \| 2\.0 s \| — \|/);
  assert.match(text, /\| workspace:format \| 2 \|$/m);
  assert.match(
    renderReport({ database: 'x.db', since: '2026-09-29T00:00:00.000Z', summary: summarizeHistory([]), ...noExtras }),
    /No history yet in this period\./,
  );
});

test('fails clearly when the database is missing', () => {
  const result = cli('--database', path.join(directory, 'missing.db'));
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^feedback:report: No Nx task database at .*missing\.db\.$/m);
});
