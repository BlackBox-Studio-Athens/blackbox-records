import assert from 'node:assert/strict';
import { test } from 'node:test';
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
