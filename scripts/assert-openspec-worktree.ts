import { execFileSync } from 'node:child_process';
import path from 'node:path';

function git(args: string[]): string {
  try {
    return execFileSync('git', args, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    const detail = error instanceof Error && error.message ? ` ${error.message}` : '';
    throw new Error(`Unable to inspect git worktree state.${detail}`, { cause: error });
  }
}

function normalizePath(value: string): string {
  return path.resolve(value).replaceAll('\\', '/').toLowerCase();
}

function readPrimaryWorktree(worktreeList: string): string | undefined {
  for (const line of worktreeList.split(/\r?\n/)) {
    if (line.startsWith('worktree ')) {
      return line.slice('worktree '.length).trim();
    }
  }

  return undefined;
}

function main(): void {
  const currentRoot = git(['rev-parse', '--show-toplevel']);
  const primaryWorktree = readPrimaryWorktree(git(['worktree', 'list', '--porcelain']));

  if (!primaryWorktree) {
    throw new Error('Unable to find the main git worktree.');
  }

  if (normalizePath(currentRoot) !== normalizePath(primaryWorktree)) {
    console.error(`OpenSpec work must run from the main worktree.

Current checkout: ${currentRoot}
Main worktree: ${primaryWorktree}

Switch to the main worktree before changing OpenSpec artifacts or implementing OpenSpec work:
cd ${primaryWorktree}`);
    process.exit(1);
  }

  const currentBranch = git(['branch', '--show-current']);

  if (currentBranch !== 'main') {
    console.error(`OpenSpec work must run on branch main in the main worktree.

Current branch: ${currentBranch || '(detached HEAD)'}
Main worktree: ${primaryWorktree}

Switch back to main before changing OpenSpec artifacts or implementing OpenSpec work:
git switch main`);
    process.exit(1);
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
