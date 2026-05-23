import { execa, type ExecaChildProcess, type ExecaReturnValue, type Options } from 'execa';

export type LocalProcessCommand = {
  args: string[];
  command: string;
  cwd?: string;
  env?: Record<string, string>;
  name: string;
};

export type LocalProcessLogger = (message: string) => void;

export type LocalProcessOptions = {
  cwd?: string;
  logger?: LocalProcessLogger;
  stdio?: Options['stdio'];
};

export type RunningLocalProcess = {
  command: LocalProcessCommand;
  subprocess: ExecaChildProcess;
};

type ExecaErrorLike = Error & {
  exitCode?: number;
  signal?: string;
  shortMessage?: string;
};

export class LocalProcessError extends Error {
  readonly exitCode?: number;
  readonly processName: string;
  readonly signal?: string;

  constructor({
    cause,
    exitCode,
    message,
    processName,
    signal,
  }: {
    cause?: unknown;
    exitCode?: number;
    message: string;
    processName: string;
    signal?: string;
  }) {
    super(message, { cause });
    this.name = 'LocalProcessError';
    this.exitCode = exitCode;
    this.processName = processName;
    this.signal = signal;
  }
}

export async function runFiniteCommand(
  command: LocalProcessCommand,
  options: LocalProcessOptions = {},
): Promise<ExecaReturnValue> {
  logCommand(command, options.logger);

  try {
    return await execa(command.command, command.args, createExecaOptions(command, options));
  } catch (error) {
    throw toLocalProcessError(command, error);
  }
}

export function createLongRunningProcessGroup(options: LocalProcessOptions = {}) {
  return new LongRunningProcessGroup(options);
}

export async function terminateLongRunningProcessesInReverse(
  processes: Pick<RunningLocalProcess, 'subprocess'>[],
  signal: NodeJS.Signals = 'SIGTERM',
) {
  for (const processEntry of [...processes].reverse()) {
    processEntry.subprocess.kill(signal);
  }

  await Promise.allSettled(processes.map((processEntry) => processEntry.subprocess));
}

export function formatLocalProcessCommand(command: LocalProcessCommand) {
  return [command.command, ...command.args].join(' ');
}

class LongRunningProcessGroup {
  private readonly options: LocalProcessOptions;
  private readonly processes: RunningLocalProcess[] = [];
  private rejectUnexpectedExit!: (error: LocalProcessError) => void;
  private readonly unexpectedExit: Promise<never>;
  private stopping = false;

  constructor(options: LocalProcessOptions) {
    this.options = options;
    this.unexpectedExit = new Promise<never>((_resolve, reject) => {
      this.rejectUnexpectedExit = reject;
    });
  }

  start(command: LocalProcessCommand): RunningLocalProcess {
    logCommand(command, this.options.logger);

    const subprocess = execa(command.command, command.args, createExecaOptions(command, this.options));
    const processEntry: RunningLocalProcess = {
      command,
      subprocess,
    };

    this.processes.push(processEntry);
    void subprocess
      .then((result) => {
        this.handleUnexpectedExit(processEntry, result);
      })
      .catch((error: unknown) => {
        this.handleUnexpectedExit(processEntry, error);
      });

    return processEntry;
  }

  async shutdown(signal: NodeJS.Signals = 'SIGTERM') {
    if (this.stopping) {
      return;
    }

    this.stopping = true;
    await terminateLongRunningProcessesInReverse(this.processes, signal);
  }

  waitForUnexpectedExit() {
    return this.unexpectedExit;
  }

  private handleUnexpectedExit(processEntry: RunningLocalProcess, errorOrResult: ExecaReturnValue | unknown) {
    if (this.stopping) {
      return;
    }

    const processError = toLocalProcessError(processEntry.command, errorOrResult);
    void this.shutdown().finally(() => {
      this.rejectUnexpectedExit(processError);
    });
  }
}

function createExecaOptions(command: LocalProcessCommand, options: LocalProcessOptions): Options {
  return {
    cwd: command.cwd ?? options.cwd,
    env: command.env,
    stdio: options.stdio ?? 'inherit',
  };
}

function logCommand(command: LocalProcessCommand, logger: LocalProcessLogger = console.log) {
  logger(`[${command.name}] ${formatLocalProcessCommand(command)}`);
}

function toLocalProcessError(command: LocalProcessCommand, errorOrResult: unknown) {
  if (isExecaResult(errorOrResult)) {
    return new LocalProcessError({
      exitCode: errorOrResult.exitCode,
      message: `[${command.name}] exited with code ${errorOrResult.exitCode ?? 'unknown'}.`,
      processName: command.name,
      signal: errorOrResult.signal,
    });
  }

  if (errorOrResult instanceof Error) {
    const execaError = errorOrResult as ExecaErrorLike;

    return new LocalProcessError({
      cause: errorOrResult,
      exitCode: execaError.exitCode,
      message: `[${command.name}] ${execaError.shortMessage ?? errorOrResult.message}`,
      processName: command.name,
      signal: execaError.signal,
    });
  }

  return new LocalProcessError({
    message: `[${command.name}] process failed.`,
    processName: command.name,
  });
}

function isExecaResult(value: unknown): value is ExecaReturnValue {
  return Boolean(value && typeof value === 'object' && 'exitCode' in value && 'failed' in value);
}
