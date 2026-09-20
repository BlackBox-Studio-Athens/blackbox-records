import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFiniteCommand } from './local-process.ts';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

export async function runParallelCommands(commands, { runner = runFiniteCommand, serial = false, signal } = {}) {
  const run = (command) => runner(command, { cwd: root, cancelSignal: signal });
  if (serial) {
    for (const command of commands) await run(command);
    return;
  }
  const results = await Promise.allSettled(commands.map(run));
  const failure = results.find((result) => result.status === 'rejected');
  if (failure) throw failure.reason;
}

function command(name, args, env) {
  return { name, command: process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', args, env };
}

async function run(mode, serial) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  process.once('SIGINT', cancel);
  process.once('SIGTERM', cancel);
  try {
    if (mode === 'builds') {
      await runParallelCommands([command('build:web', ['build:web']), command('build:staff', ['build:staff'])], {
        serial,
        signal: controller.signal,
      });
      return;
    }
    if (mode === 'browsers') {
      await runParallelCommands(
        [command('preview-policy', ['exec', process.execPath, 'scripts/test-preview-policy.mjs'])],
        { serial: true, signal: controller.signal },
      );
      await runParallelCommands(
        [
          command('editor-chromium', ['exec', process.execPath, 'scripts/test-content-workspace.mjs']),
          command('editor-firefox', ['exec', process.execPath, 'scripts/test-content-workspace.mjs', '--firefox']),
        ],
        { serial, signal: controller.signal },
      );
      return;
    }
    throw new Error(`Unknown release preparation mode: ${mode}`);
  } finally {
    process.off('SIGINT', cancel);
    process.off('SIGTERM', cancel);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(process.argv[2], process.argv.includes('--serial')).catch((error) => {
    console.error(error.message);
    process.exitCode = error.exitCode ?? 1;
  });
}
