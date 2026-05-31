import { spawnSync } from 'node:child_process';

import './assert-openspec-worktree.ts';

const args = process.argv.slice(2);
const openspecArgs = args[0] === '--' ? args.slice(1) : args;
const result = spawnSync('pnpm', ['exec', 'openspec', ...openspecArgs], {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
