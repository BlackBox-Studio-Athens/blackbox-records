#!/usr/bin/env node
// Watches the Release BlackBox push run (pages.yml) for a commit until it finishes and exits with its result.
// Usage: pnpm release:watch [ref]   (default HEAD; gh needs the full SHA, so the ref is resolved first)
import { execFileSync, spawnSync } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const read = (command, args) => execFileSync(command, args, { encoding: 'utf8', windowsHide: true }).trim();
const sha = read('git', ['rev-parse', process.argv[2] ?? 'HEAD']);

// A push registers its run a few seconds later; wait up to a minute for it.
let runId = '';
for (let attempt = 0; attempt < 12 && !runId; attempt++) {
  if (attempt) await sleep(5000);
  runId = read('gh', [
    'run',
    'list',
    '--workflow',
    'pages.yml',
    '--commit',
    sha,
    '--limit',
    '1',
    '--json',
    'databaseId',
    '--jq',
    '.[0].databaseId // ""',
  ]);
}
if (!runId) {
  console.error(`No Release BlackBox run for ${sha} after a minute. Was it pushed to main?`);
  process.exit(1);
}

console.log(`Release BlackBox run ${runId} for ${sha.slice(0, 8)}`);
const { status } = spawnSync('gh', ['run', 'watch', runId, '--exit-status', '--compact', '--interval', '30'], {
  stdio: 'inherit',
  windowsHide: true,
});
process.exit(status ?? 1);
