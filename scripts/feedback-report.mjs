import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const EXECUTED_STATUSES = new Set(['success', 'failure', 'stopped']);
const PASSED_VALIDATIONS = new Set(['passed', 'partial']);
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
// Failed, stopped and sub-second no-op runs say nothing about a task's uncontended speed.
const BASELINE_MIN_MS = 1000;
const DENIAL_LOG = fileURLToPath(new URL('../.codex-artifacts/feedback-guard/denials.jsonl', import.meta.url));

export function parseSince(value, now = Date.now()) {
  if (value === undefined) return 0;
  const relative = /^(\d+)([dh])$/.exec(value);
  if (relative) return now - Number(relative[1]) * (relative[2] === 'd' ? 24 : 1) * HOUR_MS;
  const absolute = Date.parse(value);
  if (!Number.isFinite(absolute)) throw new Error(`--since expects an ISO date, Nd or Nh; received "${value}".`);
  return absolute;
}

export function categorize({ project, target }) {
  if (target.includes('watch')) return 'watch';
  if (project === 'workspace') return 'workspace';
  if (project.endsWith('-tooling') || project === 'architecture-tests') return 'tooling tests';
  if (target === 'lint') return 'package lint';
  if (target === 'typecheck') return 'typecheck';
  if (target === 'build') return 'build';
  if (target === 'test') return 'module tests';
  return 'other';
}

const isCacheHit = ({ status }) => status.startsWith('local-cache') || status.startsWith('remote-cache');
const taskName = ({ project, target, configuration }) => [project, target, configuration].filter(Boolean).join(':');
const durationMs = ({ start, end }) => end - start;
const sum = (values) => values.reduce((total, value) => total + value, 0);
const isBaseline = (run) => run.status === 'success' && durationMs(run) >= BASELINE_MIN_MS;

export function summarizeHistory(runs, { top = 15 } = {}) {
  const executed = runs.filter(({ status }) => EXECUTED_STATUSES.has(status));
  const executedMs = sum(executed.map(durationMs));
  const tasks = [...Map.groupBy(executed, taskName)].map(([task, taskRuns]) => {
    const durations = taskRuns.map(durationMs);
    const baselines = taskRuns.filter(isBaseline).map(durationMs);
    const minMs = baselines.length ? Math.min(...baselines) : null;
    const averageMs = sum(durations) / durations.length;
    return {
      task,
      runs: durations.length,
      totalSeconds: sum(durations) / 1000,
      minSeconds: minMs === null ? null : minMs / 1000,
      averageSeconds: averageMs / 1000,
      averageOverMin: minMs === null ? null : averageMs / minMs,
    };
  });
  return {
    period: runs.length
      ? {
          from: new Date(Math.min(...runs.map(({ start }) => start))).toISOString(),
          to: new Date(Math.max(...runs.map(({ end }) => end))).toISOString(),
        }
      : null,
    executedTasks: executed.length,
    executedSeconds: executedMs / 1000,
    cacheHits: runs.filter(isCacheHit).length,
    categories: [...Map.groupBy(executed, categorize)]
      .map(([category, categoryRuns]) => {
        const categoryMs = sum(categoryRuns.map(durationMs));
        return { category, seconds: categoryMs / 1000, share: executedMs ? categoryMs / executedMs : 0 };
      })
      .sort((a, b) => b.seconds - a.seconds),
    failures: [
      ...Map.groupBy(
        executed.filter(({ status }) => status === 'failure'),
        taskName,
      ),
    ]
      .map(([task, failed]) => ({ task, failures: failed.length }))
      .sort((a, b) => b.failures - a.failures || a.task.localeCompare(b.task)),
    slowest: tasks.sort((a, b) => b.totalSeconds - a.totalSeconds).slice(0, top),
  };
}

/**
 * One JSON object per line, from `since` on. A missing file is empty; unparseable or undated lines are
 * skipped and counted.
 */
export function readJsonLines(file, since = 0) {
  const lines = existsSync(file)
    ? readFileSync(file, 'utf8')
        .split('\n')
        .filter((line) => line.trim())
    : [];
  const entries = lines.flatMap((line) => {
    try {
      const entry = JSON.parse(line);
      return Number.isFinite(Date.parse(entry?.time)) ? [entry] : [];
    } catch {
      return [];
    }
  });
  return {
    entries: entries.filter(({ time }) => Date.parse(time) >= since),
    skippedLines: lines.length - entries.length,
  };
}

export function summarizeDenials(denials) {
  return {
    total: denials.length,
    rules: [...Map.groupBy(denials, ({ rule }) => rule)]
      .map(([rule, ruleDenials]) => ({ rule, denials: ruleDenials.length }))
      .sort((a, b) => b.denials - a.denials || a.rule.localeCompare(b.rule)),
  };
}

/** Linear interpolation between the closest ranks; null without values. */
function quantile(values, q) {
  if (!values.length) return null;
  const sorted = values.toSorted((a, b) => a - b);
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  return sorted[lower] + (sorted[Math.ceil(position)] - sorted[lower]) * (position - lower);
}

const quantileSeconds = (entries, field, q) =>
  quantile(
    entries
      .map((entry) => entry[field])
      .filter(Number.isFinite)
      .map((ms) => ms / 1000),
    q,
  );

/** The UTC Monday that starts the ISO week containing `time`, as YYYY-MM-DD. */
function weekOf(time) {
  const day = Math.floor(Date.parse(time) / DAY_MS) * DAY_MS;
  return new Date(day - ((new Date(day).getUTCDay() + 6) % 7) * DAY_MS).toISOString().slice(0, 10);
}

export function summarizeTimeline(entries) {
  return [...Map.groupBy(entries, ({ time }) => weekOf(time))]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, weekEntries]) => {
      const { validate = [], denial = [], e2e = [] } = Object.groupBy(weekEntries, ({ kind }) => kind);
      return {
        week,
        validations: {
          count: validate.length,
          passedShare: validate.length
            ? validate.filter(({ status }) => PASSED_VALIDATIONS.has(status)).length / validate.length
            : null,
          medianSeconds: quantileSeconds(validate, 'durationMs', 0.5),
          p75Seconds: quantileSeconds(validate, 'durationMs', 0.75),
          medianSlotWaitSeconds: quantileSeconds(validate, 'slotWaitMs', 0.5),
          secondPasses: validate.filter(({ passes }) => passes > 1).length,
        },
        denials: denial.length,
        e2e: { count: e2e.length, medianSeconds: quantileSeconds(e2e, 'durationMs', 0.5) },
      };
    });
}

export function renderReport({ database, since, summary, denials, timeline }) {
  const count = (value) => Math.round(value).toLocaleString('en-US');
  const optional = (format) => (value) => (value === null ? '—' : format(value));
  const seconds = optional((value) => `${value.toFixed(1)} s`);
  const ratio = optional((value) => value.toFixed(1));
  const percent = optional((value) => `${(value * 100).toFixed(1)}%`);
  const lines = ['# Feedback report', '', `Database: ${database}`, `Since: ${since ?? 'all history'}`];
  if (!summary.period) lines.push('', 'No task history recorded in this period.');
  else {
    lines.push(
      `Period: ${summary.period.from} → ${summary.period.to}`,
      `Executed tasks: ${count(summary.executedTasks)} (${count(summary.executedSeconds)} task-seconds)`,
      `Cache hits: ${count(summary.cacheHits)}`,
      'Min: fastest successful run of at least 1 s; tasks without one show no Average/min.',
      '',
      '| Category | Task-seconds | Share |',
      '| --- | ---: | ---: |',
      ...summary.categories.map(
        ({ category, seconds: total, share }) => `| ${category} | ${count(total)} | ${percent(share)} |`,
      ),
      '',
      '| Task | Runs | Total | Min | Average | Average/min |',
      '| --- | ---: | ---: | ---: | ---: | ---: |',
      ...summary.slowest.map(
        (task) =>
          `| ${task.task} | ${task.runs} | ${seconds(task.totalSeconds)} | ${seconds(task.minSeconds)} | ${seconds(task.averageSeconds)} | ${ratio(task.averageOverMin)} |`,
      ),
      '',
    );
    if (summary.failures.length)
      lines.push(
        '| Failed task | Failures |',
        '| --- | ---: |',
        ...summary.failures.map(({ task, failures }) => `| ${task} | ${failures} |`),
      );
    else lines.push('No failed tasks.');
  }
  lines.push('', '## Guard denials', '', `Log: ${denials.log}`, `Denials: ${count(denials.total)}`);
  if (denials.rules.length)
    lines.push(
      '',
      '| Rule | Denials |',
      '| --- | ---: |',
      ...denials.rules.map(({ rule, denials: total }) => `| ${rule} | ${total} |`),
    );
  lines.push('', '## Timeline', '', `History: ${timeline.history}`);
  if (timeline.skippedLines) lines.push(`Skipped unparseable lines: ${timeline.skippedLines}`);
  if (!timeline.weeks.length) lines.push('', `No history yet${since ? ' in this period' : ''}.`);
  else
    lines.push(
      '',
      '| Week of | Validations | Passed | Median | p75 | Median slot wait | Second passes | Denials | E2E runs | E2E median |',
      '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
      ...timeline.weeks.map(
        ({ week, validations: v, denials: denied, e2e }) =>
          `| ${week} | ${v.count} | ${percent(v.passedShare)} | ${seconds(v.medianSeconds)} | ${seconds(v.p75Seconds)} | ${seconds(v.medianSlotWaitSeconds)} | ${v.secondPasses} | ${denied} | ${e2e.count} | ${seconds(e2e.medianSeconds)} |`,
      ),
    );
  return `${lines.join('\n')}\n`;
}

export function readTaskHistory(databasePath, since = 0) {
  if (!existsSync(databasePath)) throw new Error(`No Nx task database at ${databasePath}.`);
  // Read-only: Nx processes keep writing this WAL database while the report runs.
  const database = new DatabaseSync(databasePath, { readOnly: true, timeout: 5000 });
  try {
    return database
      .prepare(
        `SELECT d.project, d.target, d.configuration, h.status, h.start, h.end
         FROM task_history h JOIN task_details d ON d.hash = h.hash
         WHERE h.start >= ? ORDER BY h.start`,
      )
      .all(since);
  } finally {
    database.close();
  }
}

async function findTaskDatabase() {
  const { workspaceRoot } = await import('nx/src/utils/workspace-root.js');
  const { sharedDataDirectory } = await import('nx/src/utils/cache-directory.js');
  // The shared ~/.nx/<workspace id>/databases when Nx shares it, else this checkout's .nx/workspace-data.
  const directory = sharedDataDirectory(workspaceRoot, 'workspace-data');
  const newest = (existsSync(directory) ? readdirSync(directory) : [])
    .filter((name) => name.endsWith('.db'))
    .map((name) => path.join(directory, name))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
  if (!newest) throw new Error(`No Nx task database in ${directory}. Run an Nx task first or pass --database.`);
  return newest;
}

async function main() {
  const { values } = parseArgs({
    options: {
      since: { type: 'string' },
      top: { type: 'string', default: '15' },
      json: { type: 'boolean', default: false },
      database: { type: 'string' },
      denials: { type: 'string' },
      history: { type: 'string' },
    },
  });
  const top = Number(values.top);
  if (!Number.isInteger(top) || top < 1) throw new Error(`--top expects a positive integer; received "${values.top}".`);
  const sinceMs = parseSince(values.since);
  const database = values.database ? path.resolve(values.database) : await findTaskDatabase();
  const summary = summarizeHistory(readTaskHistory(database, sinceMs), { top });
  const denialLog = values.denials ? path.resolve(values.denials) : DENIAL_LOG;
  // This checkout's guard log gives the per-rule detail; the machine-wide history gives the weekly trend.
  const historyFile = values.history
    ? path.resolve(values.history)
    : (await import('./feedback-policy.mjs')).historyPath();
  const history = readJsonLines(historyFile, sinceMs);
  const report = {
    database,
    since: values.since ? new Date(sinceMs).toISOString() : null,
    summary,
    denials: { log: denialLog, ...summarizeDenials(readJsonLines(denialLog, sinceMs).entries) },
    timeline: { history: historyFile, skippedLines: history.skippedLines, weeks: summarizeTimeline(history.entries) },
  };
  process.stdout.write(values.json ? `${JSON.stringify(report, null, 2)}\n` : renderReport(report));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    console.error(`feedback:report: ${error.message}`);
    process.exitCode = 1;
  }
}
