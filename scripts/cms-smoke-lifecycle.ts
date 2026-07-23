import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import process from 'node:process';

import { redactSensitiveSmokeText } from './smoke-core';

export type CmsSmokeProcess = {
  child: ChildProcess;
  knownPids: Set<number>;
  name: string;
  output: string[];
  treeCaptureTimer: NodeJS.Timeout | null;
};

type CmsSmokeCleanup = {
  close: () => Promise<void> | void;
  name: string;
};

export type CmsSmokeProcessInput = {
  args?: string[];
  command: string;
  cwd: string;
  env: NodeJS.ProcessEnv;
  name: string;
};

export function formatCmsSmokeProcessFailure(processInfo: CmsSmokeProcess, detail: string): Error {
  const output = processInfo.output.length ? `\n${processInfo.output.join('\n')}` : '';
  return new Error(`${processInfo.name} ${detail}.${output}`);
}

export class CmsSmokeLifecycle {
  readonly processes: CmsSmokeProcess[] = [];

  private readonly cleanups: CmsSmokeCleanup[] = [];
  private readonly failureSignal: Promise<Error>;
  private resolveFailure!: (error: Error) => void;
  private failure: Error | null = null;
  private stopping = false;
  private shutdownPromise: Promise<void> | null = null;
  private handlersInstalled = false;

  constructor() {
    this.failureSignal = new Promise((resolve) => {
      this.resolveFailure = resolve;
    });
  }

  startProcess(input: CmsSmokeProcessInput): CmsSmokeProcess {
    this.assertHealthy();

    const args = input.args ?? [];
    const useShell = process.platform === 'win32';
    const command = useShell ? buildWindowsShellCommand(input.command, args) : input.command;
    const child = spawn(command, useShell ? [] : args, {
      cwd: input.cwd,
      env: input.env,
      shell: useShell,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const managed: CmsSmokeProcess = {
      child,
      knownPids: new Set(child.pid ? [child.pid] : []),
      name: input.name,
      output: [],
      treeCaptureTimer: null,
    };
    this.processes.push(managed);
    managed.treeCaptureTimer = setTimeout(() => rememberProcessTree(managed), 750);
    managed.treeCaptureTimer.unref();

    child.stdout?.on('data', (chunk: Buffer) => appendProcessOutput(managed, chunk));
    child.stderr?.on('data', (chunk: Buffer) => appendProcessOutput(managed, chunk));
    child.once('error', (error) => {
      this.fail(formatCmsSmokeProcessFailure(managed, `failed to start: ${redactSensitiveSmokeText(error.message)}`));
    });
    child.once('exit', (code, signal) => {
      if (this.stopping) return;
      const detail = signal ? `exited from signal ${signal}` : `exited with code ${code ?? 'unknown'}`;
      this.fail(formatCmsSmokeProcessFailure(managed, detail));
    });

    return managed;
  }

  registerCleanup(name: string, close: () => Promise<void> | void): void {
    this.cleanups.push({ close, name });
  }

  installProcessHandlers(): void {
    if (this.handlersInstalled) return;
    this.handlersInstalled = true;
    process.once('SIGINT', this.handleSignal);
    process.once('SIGTERM', this.handleSignal);
    process.once('SIGHUP', this.handleSignal);
    process.once('exit', this.handleExit);
  }

  async race<T>(operation: Promise<T>): Promise<T> {
    this.assertHealthy();
    return Promise.race([operation, this.failureSignal.then((error) => Promise.reject(error))]);
  }

  assertHealthy(): void {
    if (this.failure) throw this.failure;
  }

  async shutdown(): Promise<void> {
    this.shutdownPromise ??= this.performShutdown();
    return this.shutdownPromise;
  }

  areProcessesStopped(): boolean {
    return this.getRunningPids().length === 0;
  }

  getRunningPids(): number[] {
    return [...new Set(this.processes.flatMap((processInfo) => [...processInfo.knownPids]))].filter(isPidRunning);
  }

  private readonly handleSignal = (): void => {
    void this.shutdown().finally(() => {
      process.exitCode = 130;
    });
  };

  private readonly handleExit = (): void => {
    this.shutdownSync();
  };

  private fail(error: Error): void {
    if (this.stopping || this.failure) return;
    this.failure = error;
    this.resolveFailure(error);
  }

  private async performShutdown(): Promise<void> {
    this.stopping = true;
    this.removeProcessHandlers();

    for (const cleanup of [...this.cleanups].reverse()) {
      try {
        await cleanup.close();
      } catch (error) {
        const message = redactSensitiveSmokeText(error instanceof Error ? error.message : String(error));
        console.error(`Failed to close ${cleanup.name}: ${message}`);
      }
    }

    const processErrors: string[] = [];
    for (const processInfo of [...this.processes].reverse()) {
      try {
        await stopCmsSmokeProcess(processInfo);
      } catch (error) {
        processErrors.push(redactSensitiveSmokeText(error instanceof Error ? error.message : String(error)));
      }
    }

    if (processErrors.length) throw new Error(processErrors.join('\n'));
  }

  private shutdownSync(): void {
    this.stopping = true;
    for (const processInfo of [...this.processes].reverse()) stopCmsSmokeProcessSync(processInfo);
  }

  private removeProcessHandlers(): void {
    if (!this.handlersInstalled) return;
    this.handlersInstalled = false;
    process.removeListener('SIGINT', this.handleSignal);
    process.removeListener('SIGTERM', this.handleSignal);
    process.removeListener('SIGHUP', this.handleSignal);
    process.removeListener('exit', this.handleExit);
  }
}

function buildWindowsShellCommand(command: string, args: string[]): string {
  return [command, ...args].map((value) => `"${value.replace(/"/g, '\\"')}"`).join(' ');
}

function appendProcessOutput(processInfo: CmsSmokeProcess, chunk: Buffer): void {
  const text = redactSensitiveSmokeText(chunk.toString('utf8'));
  processInfo.output.push(...text.split(/\r?\n/).filter(Boolean));
  processInfo.output = processInfo.output.slice(-80);
}

function stopCmsSmokeProcessSync(processInfo: CmsSmokeProcess): void {
  const { child } = processInfo;
  if (processInfo.treeCaptureTimer) {
    clearTimeout(processInfo.treeCaptureTimer);
    processInfo.treeCaptureTimer = null;
  }
  rememberProcessTree(processInfo);

  if (process.platform === 'win32') {
    for (const pid of [...processInfo.knownPids].sort((left, right) => right - left)) {
      if (isPidRunning(pid)) spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' });
    }
  } else {
    if (child.pid && isPidRunning(child.pid)) child.kill('SIGTERM');
  }
}

async function stopCmsSmokeProcess(processInfo: CmsSmokeProcess): Promise<void> {
  stopCmsSmokeProcessSync(processInfo);
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline && [...processInfo.knownPids].some(isPidRunning)) {
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
  }

  const runningPids = [...processInfo.knownPids].filter(isPidRunning);
  if (runningPids.length) {
    throw new Error(`${processInfo.name} left owned process IDs running: ${runningPids.join(', ')}.`);
  }
}

function rememberProcessTree(processInfo: CmsSmokeProcess): void {
  const rootPid = processInfo.child.pid;
  if (!rootPid) return;
  processInfo.knownPids.add(rootPid);
  if (process.platform !== 'win32') return;
  for (const pid of collectWindowsProcessTree(rootPid)) processInfo.knownPids.add(pid);
}

function collectWindowsProcessTree(rootPid: number): number[] {
  const script = [
    `$rootPid = ${rootPid}`,
    '$all = Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId',
    '$known = @($rootPid)',
    'do {',
    '  $children = @($all | Where-Object { $known -contains $_.ParentProcessId -and $known -notcontains $_.ProcessId } | ForEach-Object { [int]$_.ProcessId })',
    '  $known += $children',
    '} while ($children.Count -gt 0)',
    '$known -join ","',
  ].join('\n');
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.status !== 0) return [rootPid];
  return result.stdout
    .trim()
    .split(',')
    .map(Number)
    .filter((pid) => Number.isInteger(pid) && pid > 0);
}

function isPidRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
