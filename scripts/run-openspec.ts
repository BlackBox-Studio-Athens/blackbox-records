import { spawnSync } from 'node:child_process';

import './assert-openspec-worktree.ts';

const args = process.argv.slice(2);
const forwardedArgs = args.filter((arg) => arg !== '--allow-worktree');
const openspecArgs = forwardedArgs[0] === '--' ? forwardedArgs.slice(1) : forwardedArgs;
const result = spawnSync('pnpm', ['exec', 'openspec', ...openspecArgs], {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
