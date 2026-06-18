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
const originalConsoleWarn = console.warn.bind(console);
const originalStderrWrite = process.stderr.write.bind(process.stderr);
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
let consoleWarnFilterInstalled = false;

function stringifyWrittenChunk(chunk: unknown): string {
  if (typeof chunk === 'string') {
    return chunk;
  }

  if (chunk instanceof Uint8Array) {
    return new TextDecoder().decode(chunk);
  }

  return String(chunk);
}

export function installFilteredViteConsoleWarningFilter() {
  if (consoleWarnFilterInstalled) {
    return;
  }

  consoleWarnFilterInstalled = true;
  console.warn = (...args: unknown[]) => {
    const message = args.map((arg) => String(arg)).join(' ');
    if (ignoredDependencySourcemapWarning.test(message)) {
      return;
    }

    originalConsoleWarn(...args);
  };
  process.stderr.write = ((chunk: string | Uint8Array, ...args: unknown[]) => {
    if (ignoredDependencySourcemapWarning.test(stringifyWrittenChunk(chunk))) {
      return true;
    }

    return originalStderrWrite(chunk as never, ...(args as never[]));
  }) as typeof process.stderr.write;
  process.stdout.write = ((chunk: string | Uint8Array, ...args: unknown[]) => {
    if (ignoredDependencySourcemapWarning.test(stringifyWrittenChunk(chunk))) {
      return true;
    }

    return originalStdoutWrite(chunk as never, ...(args as never[]));
  }) as typeof process.stdout.write;
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
    if (ignoredDependencySourcemapWarning.test(message)) {
      return;
    }

    filteredViteLogger.hasWarned = true;
    originalConsoleWarn(message);
  },
  warnOnce(message: string, options?: ViteLogOptions) {
    if (warnedMessages.has(message)) {
      return;
    }

    warnedMessages.add(message);
    filteredViteLogger.warn(message, options);
  },
};
