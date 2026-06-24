import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export type PauseCatalogCheckoutOptions = {
  apply: boolean;
  environment: 'prd' | 'uat';
  variantId: string;
};

const backendDir = path.join(process.cwd(), 'apps', 'backend');

export function parsePauseCatalogCheckoutArgs(args: string[]): PauseCatalogCheckoutOptions {
  const options: PauseCatalogCheckoutOptions = {
    apply: false,
    environment: 'prd',
    variantId: '',
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: pnpm catalog:checkout:pause -- --variant-id <variant> [--env prd|uat] [--apply] (legacy platform aliases accepted: sandbox, production)',
      );
      process.exit(0);
    }

    if (arg === '--apply') {
      options.apply = true;
      continue;
    }

    if (arg === '--env') {
      options.environment = parseEnvironment(args[index + 1]);
      index += 1;
      continue;
    }

    if (arg?.startsWith('--env=')) {
      options.environment = parseEnvironment(arg.slice('--env='.length));
      continue;
    }

    if (arg === '--variant-id') {
      options.variantId = parseRequiredValue('--variant-id', args[index + 1]);
      index += 1;
      continue;
    }

    if (arg?.startsWith('--variant-id=')) {
      options.variantId = parseRequiredValue('--variant-id', arg.slice('--variant-id='.length));
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.variantId) {
    throw new Error('--variant-id is required.');
  }

  return options;
}

export function createPauseCatalogCheckoutSql(variantId: string): string {
  return [
    'UPDATE "ItemAvailability"',
    'SET "status" = \'sold_out\',',
    '    "canBuy" = FALSE,',
    '    "updatedAt" = CURRENT_TIMESTAMP',
    `WHERE "variantId" = ${sqlString(variantId)};`,
  ].join('\n');
}

export function formatPauseCatalogCheckoutReport(options: PauseCatalogCheckoutOptions): string {
  return [
    `Catalog checkout pause ${options.apply ? 'applied' : 'planned'}.`,
    `Environment: ${options.environment}`,
    `Variant: ${options.variantId}`,
    'Mutation: ItemAvailability only; Stripe Products, Stripe Prices, orders, stock rows, and evidence are not deleted.',
  ].join('\n');
}

function runD1Sql(options: PauseCatalogCheckoutOptions): void {
  const commandSql = createPauseCatalogCheckoutSql(options.variantId).replace(/\s+/g, ' ').trim();
  const command = createPnpmCommand([
    'exec',
    'wrangler',
    'd1',
    'execute',
    'COMMERCE_DB',
    '--env',
    options.environment,
    '--remote',
    '--command',
    commandSql,
    '--json',
  ]);
  const result = spawnSync(command.command, command.args, {
    cwd: backendDir,
    encoding: 'utf8',
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error([result.stderr.trim(), result.stdout.trim()].filter(Boolean).join('\n'));
  }
}

function parseEnvironment(value: string | undefined): PauseCatalogCheckoutOptions['environment'] {
  if (value === 'prd' || value === 'uat') {
    return value;
  }

  if (value === 'production') {
    return 'prd';
  }

  if (value === 'sandbox') {
    return 'uat';
  }

  throw new Error('--env must be prd or uat. Legacy platform aliases accepted: sandbox, production.');
}

function parseRequiredValue(name: string, value: string | undefined): string {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(`${name} requires a value.`);
  }

  return normalized;
}

function sqlString(value: string): string {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function createPnpmCommand(args: string[]): { args: string[]; command: string } {
  return process.platform === 'win32'
    ? { args: ['/d', '/s', '/c', 'pnpm', ...args], command: 'cmd.exe' }
    : { args, command: 'pnpm' };
}

async function main(): Promise<void> {
  const options = parsePauseCatalogCheckoutArgs(process.argv.slice(2));

  if (options.apply) {
    runD1Sql(options);
  }

  console.log(formatPauseCatalogCheckoutReport(options));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
