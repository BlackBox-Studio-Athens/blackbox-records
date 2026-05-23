import { existsSync, readFileSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import { createLongRunningProcessGroup, LocalProcessError, runFiniteCommand } from './local-process';

export type LocalStackMode = 'stripe-test' | 'stripe-mock' | 'stripe-mock-api';

export type StackCommand = {
  args: string[];
  command: string;
  env?: Record<string, string>;
  name: string;
  waitForPort?: number;
};

export type StackPlan = {
  longRunning: StackCommand[];
  mode: LocalStackMode;
  ports: number[];
  prepare: StackCommand[];
};

const rootDir = process.cwd();
const BACKEND_PORT = 8787;
const STATIC_PORT = 4321;
const STRIPE_MOCK_PROXY_PORT = 12110;
const STRIPE_MOCK_HTTP_PORT = 12111;
const STRIPE_MOCK_HTTPS_PORT = 12112;

export function buildStackPlan(mode: LocalStackMode): StackPlan {
  const prepare: StackCommand[] = [
    {
      args: ['--filter', '@blackbox/backend', 'd1:prepare:local'],
      command: 'pnpm',
      name: 'Prepare local D1',
    },
  ];
  const longRunning: StackCommand[] = [];
  const ports =
    mode === 'stripe-mock' || mode === 'stripe-mock-api'
      ? [STRIPE_MOCK_PROXY_PORT, STRIPE_MOCK_HTTP_PORT, STRIPE_MOCK_HTTPS_PORT, BACKEND_PORT, STATIC_PORT]
      : [BACKEND_PORT, STATIC_PORT];

  if (mode === 'stripe-test') {
    prepare.push({
      args: ['--filter', '@blackbox/backend', 'd1:seed:stripe-test:local'],
      command: 'pnpm',
      name: 'Seed real Stripe test mappings',
    });
    longRunning.push(
      {
        args: ['dev:backend'],
        command: 'pnpm',
        name: 'Worker',
        waitForPort: BACKEND_PORT,
      },
      {
        args: ['site:dev'],
        command: 'pnpm',
        env: {
          PUBLIC_BACKEND_BASE_URL: `http://127.0.0.1:${BACKEND_PORT}`,
          PUBLIC_CHECKOUT_CLIENT_MODE: 'stripe',
        },
        name: 'Static site',
        waitForPort: STATIC_PORT,
      },
    );
  } else if (mode === 'stripe-mock') {
    prepare.push({
      args: ['--filter', '@blackbox/backend', 'd1:seed:stripe-mock:local'],
      command: 'pnpm',
      name: 'Seed stripe-mock mappings',
    });
    longRunning.push(
      {
        args: ['stripe-mock:local'],
        command: 'pnpm',
        name: 'Stripe mock API',
        waitForPort: STRIPE_MOCK_PROXY_PORT,
      },
      {
        args: ['dev:backend:mock'],
        command: 'pnpm',
        name: 'Worker',
        waitForPort: BACKEND_PORT,
      },
      {
        args: ['site:dev'],
        command: 'pnpm',
        env: {
          PUBLIC_BACKEND_BASE_URL: `http://127.0.0.1:${BACKEND_PORT}`,
          PUBLIC_CHECKOUT_CLIENT_MODE: 'mock',
        },
        name: 'Static site',
        waitForPort: STATIC_PORT,
      },
    );
  } else {
    prepare.push({
      args: ['--filter', '@blackbox/backend', 'd1:seed:stripe-mock:local'],
      command: 'pnpm',
      name: 'Seed stripe-mock mappings',
    });
    longRunning.push(
      {
        args: ['stripe-mock:local'],
        command: 'pnpm',
        name: 'Stripe mock API',
        waitForPort: STRIPE_MOCK_PROXY_PORT,
      },
      {
        args: ['dev:backend:mock-api'],
        command: 'pnpm',
        name: 'Worker',
        waitForPort: BACKEND_PORT,
      },
      {
        args: ['site:dev'],
        command: 'pnpm',
        env: {
          PUBLIC_BACKEND_BASE_URL: `http://127.0.0.1:${BACKEND_PORT}`,
          PUBLIC_CHECKOUT_CLIENT_MODE: 'mock',
        },
        name: 'Static site',
        waitForPort: STATIC_PORT,
      },
    );
  }

  return {
    longRunning,
    mode,
    ports,
    prepare,
  };
}

export function readRequiredEnvironmentIssues(
  mode: LocalStackMode,
  _env = process.env,
  devVarKeys = readDevVars(),
): string[] {
  const issues: string[] = [];

  if (mode === 'stripe-test' && !devVarKeys.has('STRIPE_SECRET_KEY')) {
    issues.push('apps/backend/.dev.vars must define STRIPE_SECRET_KEY for dev:stack:stripe-test.');
  }

  if (mode === 'stripe-test' && !devVarKeys.has('STRIPE_PAYMENT_METHOD_CONFIGURATION_ID')) {
    issues.push('apps/backend/.dev.vars must define STRIPE_PAYMENT_METHOD_CONFIGURATION_ID for dev:stack:stripe-test.');
  }

  return issues;
}

export async function isPortAvailable(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once('error', (error: NodeJS.ErrnoException) => {
      server.close();

      if (error.code === 'EADDRINUSE') {
        resolve(false);
        return;
      }

      reject(error);
    });

    server.once('listening', () => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(true);
      });
    });

    server.listen(port, host);
  });
}

async function main() {
  const mode = parseMode(process.argv[2]);
  const plan = buildStackPlan(mode);
  const envIssues = readRequiredEnvironmentIssues(mode);

  if (envIssues.length) {
    for (const issue of envIssues) {
      console.error(issue);
    }

    process.exit(1);
  }

  await assertPortsAvailable(plan.ports);

  for (const command of plan.prepare) {
    try {
      await runFiniteCommand(command, { cwd: rootDir });
    } catch (error) {
      exitAfterFiniteCommandFailure(error);
    }
  }

  const processes = createLongRunningProcessGroup({ cwd: rootDir });

  const shutdown = () => {
    void processes.shutdown();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  for (const command of plan.longRunning) {
    processes.start(command);

    if (command.waitForPort) {
      await Promise.race([waitForPort(command.waitForPort, command.name), processes.waitForUnexpectedExit()]);
    }
  }

  try {
    await processes.waitForUnexpectedExit();
  } catch (error) {
    exitAfterUnexpectedServiceExit(error);
  }
}

function parseMode(value: string | undefined): LocalStackMode {
  if (value === 'stripe-test' || value === 'stripe-mock' || value === 'stripe-mock-api') {
    return value;
  }

  console.error('Usage: pnpm dev:stack:stripe-test OR pnpm dev:stack:stripe-mock OR pnpm dev:stack:stripe-mock-api');
  process.exit(1);
}

function readDevVars(): Set<string> {
  const devVarsPath = path.join(rootDir, 'apps', 'backend', '.dev.vars');

  if (!existsSync(devVarsPath)) {
    return new Set();
  }

  return new Set(
    readFileSync(devVarsPath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => line.split('=')[0]?.trim())
      .filter((key): key is string => Boolean(key)),
  );
}

async function assertPortsAvailable(ports: number[]) {
  const unavailablePorts: number[] = [];

  for (const port of ports) {
    if (!(await isPortAvailable(port))) {
      unavailablePorts.push(port);
    }
  }

  if (unavailablePorts.length) {
    throw new Error(`Port(s) already in use: ${unavailablePorts.join(', ')}. Stop the existing local stack and retry.`);
  }
}

async function waitForPort(port: number, label: string) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (!(await isPortAvailable(port))) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`${label} did not start on port ${port}.`);
}

function exitAfterFiniteCommandFailure(error: unknown): never {
  if (error instanceof LocalProcessError) {
    if (typeof error.exitCode === 'number') {
      process.exit(error.exitCode);
    }

    console.error(error.message);
    process.exit(1);
  }

  throw error;
}

function exitAfterUnexpectedServiceExit(error: unknown): never {
  if (error instanceof LocalProcessError) {
    console.error(`[${error.processName}] exited before the local stack stopped. Shutting down remaining services.`);
    process.exit(1);
  }

  throw error;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
