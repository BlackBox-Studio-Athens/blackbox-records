import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const seedPath = path.join(backendDir, 'prisma', 'seeds', 'local-stripe-test-state.sql');

if (!existsSync(seedPath)) {
  console.error(
    [
      'Missing apps/backend/prisma/seeds/local-stripe-test-state.sql.',
      'Copy apps/backend/prisma/seeds/local-stripe-test-state.sql.example and replace the placeholder with a real Stripe test Price ID.',
    ].join('\n'),
  );
  process.exit(1);
}

const command =
  process.platform === 'win32'
    ? {
        command: 'cmd.exe',
        args: [
          '/d',
          '/s',
          '/c',
          'pnpm',
          'exec',
          'wrangler',
          'd1',
          'execute',
          'COMMERCE_DB',
          '--local',
          '--file',
          './prisma/seeds/local-stripe-test-state.sql',
          '--json',
        ],
      }
    : {
        command: 'pnpm',
        args: [
          'exec',
          'wrangler',
          'd1',
          'execute',
          'COMMERCE_DB',
          '--local',
          '--file',
          './prisma/seeds/local-stripe-test-state.sql',
          '--json',
        ],
      };

const result = spawnSync(command.command, command.args, {
  cwd: backendDir,
  shell: false,
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error.message);
}

process.exit(result.status ?? 1);
