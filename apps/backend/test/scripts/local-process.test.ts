import process from 'node:process';

import { describe, expect, it } from 'vitest';

import {
  createLongRunningProcessGroup,
  runFiniteCommand,
  terminateLongRunningProcessesInReverse,
  type RunningLocalProcess,
} from '../../../../scripts/local-process';

const nodeBin = process.execPath;

describe('local process helper', () => {
  it('runs finite commands and applies env overlays without logging env values', async () => {
    const logs: string[] = [];
    const result = await runFiniteCommand(
      {
        args: ['-e', 'process.exit(process.env.BLACKBOX_SECRET_VALUE ? 0 : 3)'],
        command: nodeBin,
        env: {
          BLACKBOX_SECRET_VALUE: 'hidden-value',
        },
        name: 'Env overlay probe',
      },
      {
        logger: (message) => logs.push(message),
        stdio: 'pipe',
      },
    );

    expect(result.exitCode).toBe(0);
    expect(logs).toHaveLength(1);
    expect(logs.join('\n')).toContain('[Env overlay probe]');
    expect(logs.join('\n')).not.toContain('hidden-value');
  });

  it('surfaces finite command non-zero exits with the service label and status code', async () => {
    await expect(
      runFiniteCommand(
        {
          args: ['-e', 'process.exit(7)'],
          command: nodeBin,
          name: 'Failing finite command',
        },
        {
          logger: () => {},
          stdio: 'pipe',
        },
      ),
    ).rejects.toMatchObject({
      exitCode: 7,
      processName: 'Failing finite command',
    });
  });

  it('reports failed long-running process starts with the service label', async () => {
    const processes = createLongRunningProcessGroup({
      logger: () => {},
      stdio: 'pipe',
    });

    processes.start({
      args: [],
      command: 'blackbox-records-command-that-does-not-exist',
      name: 'Missing service',
    });

    await expect(processes.waitForUnexpectedExit()).rejects.toMatchObject({
      processName: 'Missing service',
    });
  });

  it('terminates sibling services when a long-running process exits unexpectedly', async () => {
    const processes = createLongRunningProcessGroup({
      logger: () => {},
      stdio: 'pipe',
    });

    const sibling = processes.start({
      args: ['-e', 'setInterval(() => {}, 1000);'],
      command: nodeBin,
      name: 'Sibling service',
    });
    processes.start({
      args: ['-e', 'setTimeout(() => process.exit(5), 50);'],
      command: nodeBin,
      name: 'Crashing service',
    });

    await expect(processes.waitForUnexpectedExit()).rejects.toMatchObject({
      exitCode: 5,
      processName: 'Crashing service',
    });
    await expect(sibling.subprocess).rejects.toMatchObject({
      killed: true,
      signal: 'SIGTERM',
    });
  });

  it('terminates long-running processes in reverse launch order', async () => {
    const killedProcesses: string[] = [];
    const processes = ['first', 'second'].map(
      (name) =>
        ({
          subprocess: {
            kill: () => {
              killedProcesses.push(name);
              return true;
            },
          },
        }) as unknown as RunningLocalProcess,
    );

    await terminateLongRunningProcessesInReverse(processes);

    expect(killedProcesses).toEqual(['second', 'first']);
  });
});
