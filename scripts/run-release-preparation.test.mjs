import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadPolicy } from './feedback-policy.mjs';
import { runParallelCommands } from './run-release-preparation.mjs';

test('parallel preparation starts and settles every child before reporting failure', async () => {
  const started = [];
  await assert.rejects(
    runParallelCommands([{ name: 'bad' }, { name: 'slow' }], {
      runner: async (command) => {
        started.push(command.name);
        if (command.name === 'bad') throw new Error('bad child');
        await new Promise((resolve) => setTimeout(resolve, 10));
      },
    }),
    /bad child/,
  );
  assert.deepEqual(started, ['bad', 'slow']);
});

test('children of an admitted preparation keep running after the grant expires', async () => {
  const envs = [];
  await runParallelCommands([{ name: 'editor', env: { KEEP: 'x' } }], {
    serial: true,
    runner: async (command) => envs.push(command.env),
  });
  assert.deepEqual(envs, [{ KEEP: 'x', [loadPolicy().releaseTier.overrideEnv]: '1' }]);
});
