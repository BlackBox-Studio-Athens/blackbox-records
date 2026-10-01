import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Sorted paths of the non-ignored files present under roots; neither file content nor Git index state changes it. */
export function listTreeFiles(roots, cwd = process.cwd()) {
  const listed = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', ...roots], {
    cwd,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
  });
  return [...new Set(listed.split('\0').filter(Boolean))].filter((file) => existsSync(path.join(cwd, file))).sort();
}

// Nx runtime input: rerun a task when a file under the given roots is added, removed or renamed.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  console.log(listTreeFiles(process.argv.slice(2)).join('\n'));
