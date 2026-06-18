type ViteLogOptions = {
  clear?: boolean;
  environment?: string;
  timestamp?: boolean;
};

type ViteLogErrorOptions = ViteLogOptions & {
  error?: Error | null;
};

const ignoredDependencySourcemapWarning =
  /Sourcemap for ".*node_modules.*(?:stripe|standardwebhooks).*" points to missing source files/;
const warnedMessages = new Set<string>();
const loggedErrors = new WeakSet<Error>();
const originalStderrWrite = process.stderr.write.bind(process.stderr);
let workerPoolSourcemapStderrFilterInstalled = false;

function isIgnoredDependencySourcemapWarning(message: string): boolean {
  return ignoredDependencySourcemapWarning.test(message);
}

export function filterBackendTestConsoleLog(log: string): false | undefined {
  return isIgnoredDependencySourcemapWarning(log) ? false : undefined;
}

export function installBackendWorkerPoolSourcemapStderrFilter() {
  if (workerPoolSourcemapStderrFilterInstalled) {
    return;
  }

  workerPoolSourcemapStderrFilterInstalled = true;
  process.stderr.write = ((chunk: string | Uint8Array, ...args: unknown[]) => {
    const message = typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk);
    if (isIgnoredDependencySourcemapWarning(message)) {
      return true;
    }

    return originalStderrWrite(chunk as never, ...(args as never[]));
  }) as typeof process.stderr.write;
}

export const filteredViteLogger = {
  hasWarned: false,
  clearScreen() {
    return;
  },
  error(message: string, options?: ViteLogErrorOptions) {
    if (options?.error) {
      loggedErrors.add(options.error);
    }

    console.error(message);
  },
  hasErrorLogged(error: Error) {
    return loggedErrors.has(error);
  },
  info(message: string, _options?: ViteLogOptions) {
    console.info(message);
  },
  warn(message: string, _options?: ViteLogOptions) {
    if (isIgnoredDependencySourcemapWarning(message)) {
      return;
    }

    filteredViteLogger.hasWarned = true;
    console.warn(message);
  },
  warnOnce(message: string, options?: ViteLogOptions) {
    if (warnedMessages.has(message)) {
      return;
    }

    warnedMessages.add(message);
    filteredViteLogger.warn(message, options);
  },
};
