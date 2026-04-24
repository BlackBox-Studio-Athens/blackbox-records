import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export type LocalStackMode = 'stripe-test' | 'stripe-mock';

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
const STRIPE_MOCK_PORT = 12111;

export function buildStackPlan(mode: LocalStackMode): StackPlan {
    const prepare: StackCommand[] = [
        {
            args: ['--filter', '@blackbox/backend', 'd1:prepare:local'],
            command: 'pnpm',
            name: 'Prepare local D1',
        },
    ];
    const longRunning: StackCommand[] = [];
    const ports = [BACKEND_PORT, STATIC_PORT];

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
    } else {
        prepare.push({
            args: ['--filter', '@blackbox/backend', 'd1:seed:stripe-mock:local'],
            command: 'pnpm',
            name: 'Seed stripe-mock mappings',
        });
        ports.push(STRIPE_MOCK_PORT);
        longRunning.push(
            {
                args: ['run', '--rm', '-p', `${STRIPE_MOCK_PORT}:12111`, 'stripe/stripe-mock:latest'],
                command: 'docker',
                name: 'stripe-mock',
                waitForPort: STRIPE_MOCK_PORT,
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
                    PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_mock',
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
    env = process.env,
    devVarKeys = readDevVars(),
): string[] {
    const issues: string[] = [];

    if (mode === 'stripe-test' && !env.PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()) {
        issues.push('PUBLIC_STRIPE_PUBLISHABLE_KEY is required for dev:stack:stripe-test.');
    }

    if (!devVarKeys.has('STRIPE_SECRET_KEY')) {
        issues.push('apps/backend/.dev.vars must define STRIPE_SECRET_KEY. Use sk_test_mock for stripe-mock mode.');
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
        runOnce(command);
    }

    const children: ChildProcess[] = [];
    let shuttingDown = false;

    const shutdown = () => {
        shuttingDown = true;

        for (const child of [...children].reverse()) {
            if (!child.killed) {
                child.kill('SIGTERM');
            }
        }
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    for (const command of plan.longRunning) {
        const child = spawnLongRunning(command, () => {
            if (shuttingDown) {
                return;
            }

            console.error(`[${command.name}] exited before the local stack stopped. Shutting down remaining services.`);
            shutdown();
            process.exit(1);
        });
        children.push(child);

        if (command.waitForPort) {
            await waitForPort(command.waitForPort, command.name);
        }
    }
}

function parseMode(value: string | undefined): LocalStackMode {
    if (value === 'stripe-test' || value === 'stripe-mock') {
        return value;
    }

    console.error('Usage: pnpm dev:stack:stripe-test OR pnpm dev:stack:stripe-mock');
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

function runOnce(command: StackCommand) {
    console.log(`[${command.name}] ${command.command} ${command.args.join(' ')}`);
    const result = spawnSync(resolveCommand(command.command), command.args, {
        cwd: rootDir,
        env: {
            ...process.env,
            ...command.env,
        },
        shell: false,
        stdio: 'inherit',
    });

    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

function spawnLongRunning(command: StackCommand, onUnexpectedExit: () => void): ChildProcess {
    console.log(`[${command.name}] ${command.command} ${command.args.join(' ')}`);

    const child = spawn(resolveCommand(command.command), command.args, {
        cwd: rootDir,
        env: {
            ...process.env,
            ...command.env,
        },
        shell: false,
        stdio: 'inherit',
    });

    child.once('error', (error) => {
        console.error(`[${command.name}] failed to start: ${error.message}`);
        onUnexpectedExit();
    });

    child.once('exit', () => {
        onUnexpectedExit();
    });

    return child;
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

function resolveCommand(command: string): string {
    return process.platform === 'win32' ? `${command}.cmd` : command;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    void main().catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
    });
}
