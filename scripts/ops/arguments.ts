import { DISTRO_GROUP_VALUES, type DistroGroupName } from '@blackbox/content-model';
import { Argument, Command, Option, type OutputConfiguration } from 'commander';

export class OpsError extends Error {}

const environments = ['uat', 'prd'] as const;
export type OperatorEnvironment = (typeof environments)[number];
export type EuroMinor = number & { readonly unit: 'EuroMinor' };
export type Copies = number & { readonly unit: 'Copies' };
export type CmsId = string & { readonly kind: 'CmsId' };
export type VariantId = string & { readonly kind: 'VariantId' };

export function environmentOf(value: unknown): OperatorEnvironment {
  if (value === 'uat' || value === 'prd') return value;
  throw new OpsError('Choose --env uat or --env prd.');
}

function euroMinorOf(value: string): EuroMinor {
  if (!/^\d{1,6}(?:[.,]\d{1,2})?$/.test(value)) {
    throw new OpsError('--price must be a positive EUR amount with up to two decimal places.');
  }
  const [whole, fraction = ''] = value.split(/[.,]/);
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (amount === 0) throw new OpsError('--price must be at least EUR 0.01.');
  return amount as EuroMinor;
}

function copiesOf(value: string): Copies {
  const copies = Number(value);
  if (!/^\d+$/.test(value) || copies > 2_147_483_647) {
    throw new OpsError('--copies must be a whole number from 0 to 2147483647.');
  }
  return copies as Copies;
}

export function cmsIdOf(value: unknown): CmsId {
  if (typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value)) return value as CmsId;
  throw new OpsError('Use a valid CMS record or media ID.');
}

export function variantIdOf(value: unknown): VariantId {
  if (typeof value === 'string' && /^variant_[A-Za-z0-9_-]+$/.test(value)) return value as VariantId;
  throw new OpsError('Use a valid variant ID (variant_…).');
}

export function distroFormatOf(value: unknown): DistroGroupName {
  const format = DISTRO_GROUP_VALUES.find((candidate) => candidate === value);
  if (!format) throw new OpsError(`Choose a supported Distro format: ${DISTRO_GROUP_VALUES.join(', ')}.`);
  return format;
}

type WriteOptions = { env: OperatorEnvironment; apply: boolean; confirmLive: boolean; yes: boolean };
type DistroOptions = WriteOptions & { price: EuroMinor; copies: Copies; publish: boolean };
export type DistroCreate = DistroOptions & {
  action: 'distro create';
  title: string;
  artist: string;
  format: DistroGroupName;
  image: string;
  alt: string;
  summary: string;
  condition: 'new' | 'used';
};
export type DistroSetup = DistroOptions & { action: 'distro setup'; id: CmsId };
export type StockSet = WriteOptions & { action: 'stock set'; variant: VariantId; copies: Copies };
export type WriteCommand = DistroCreate | DistroSetup | StockSet;
type OpsCommand =
  WriteCommand | { action: 'login'; env: OperatorEnvironment } | { action: 'whoami'; env: OperatorEnvironment };

function required(value: unknown, flag: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new OpsError(`--${flag} is required.`);
  return value;
}

function writeFlags(values: Record<string, unknown>): WriteOptions {
  return {
    env: environmentOf(values.env),
    apply: values.apply === true,
    confirmLive: values.confirmLive === true,
    yes: values.yes === true,
  };
}

function distroFlags(values: Record<string, unknown>): DistroOptions {
  return {
    ...writeFlags(values),
    price: euroMinorOf(required(values.price, 'price').trim()),
    copies: copiesOf(required(values.copies, 'copies')),
    publish: values.publish === true,
  };
}

function environmentOption(): Option {
  return new Option('--env <uat|prd>', 'Staff environment.').choices(environments).makeOptionMandatory();
}

function writeOptions(command: Command): Command {
  return command
    .addOption(environmentOption())
    .requiredOption('--copies <n>', 'Physical copies, from 0 to 2147483647.')
    .option('--apply', 'Apply the write. Without this flag, show a dry-run plan.')
    .option('--yes', 'Skip typed confirmation and the terminal requirement when applying.')
    .option('--confirm-live', 'Required when applying to PRD.');
}

function distroOptions(command: Command): Command {
  return writeOptions(command)
    .requiredOption('--price <EUR>', 'Positive EUR amount with up to two decimal places.')
    .option('--publish', 'Request shop publication after setup completes.');
}

export function parseCommand(
  args: string[],
  output: OutputConfiguration = { writeOut: () => {}, writeErr: () => {} },
): OpsCommand {
  let command: OpsCommand | undefined;
  const program = new Command()
    .name('pnpm ops')
    .description('Run Staff operations for UAT or PRD.')
    .configureOutput(output)
    .exitOverride();

  program
    .command('login')
    .description('Sign in to Staff Access through cloudflared.')
    .addArgument(new Argument('<uat|prd>', 'Staff environment.').choices(environments))
    .action((env: string) => {
      command = { action: 'login', env: environmentOf(env) };
    });
  const whoami = program
    .command('whoami')
    .description('Check the verified Staff identity.')
    .addOption(environmentOption())
    .action((values: Record<string, unknown>) => {
      command = { action: 'whoami', env: environmentOf(values.env) };
    });

  const distro = program.command('distro').description('Set up Distro items.');
  const create = distroOptions(distro.command('create').description('Create a Distro item and set up its commerce.'))
    .requiredOption('--title <title>', 'Release title.')
    .requiredOption('--artist <artist>', 'Artist or label.')
    .requiredOption('--format <format>', `Distro format (${DISTRO_GROUP_VALUES.join(', ')}).`)
    .requiredOption('--image <file>', 'Path to the artwork file.')
    .requiredOption('--alt <text>', 'Artwork alternative text.')
    .requiredOption('--summary <text>', 'Item description.')
    .addOption(new Option('--condition <new|used>', 'Item condition.').choices(['new', 'used']).makeOptionMandatory())
    .action((values: Record<string, unknown>) => {
      const condition = values.condition;
      if (condition !== 'new' && condition !== 'used')
        throw new OpsError('Choose --condition new or --condition used.');
      command = {
        action: 'distro create',
        ...distroFlags(values),
        title: required(values.title, 'title').trim(),
        artist: required(values.artist, 'artist').trim(),
        format: distroFormatOf(values.format),
        image: required(values.image, 'image'),
        alt: required(values.alt, 'alt').trim(),
        summary: required(values.summary, 'summary').trim(),
        condition,
      };
    });
  const setup = distroOptions(distro.command('setup').description('Set up commerce for an existing Distro item.'))
    .requiredOption('--id <id>', 'CMS record ID.')
    .action((values: Record<string, unknown>) => {
      command = { action: 'distro setup', ...distroFlags(values), id: cmsIdOf(values.id) };
    });

  const stock = program.command('stock').description('Record stock counts.');
  const set = writeOptions(stock.command('set').description('Record the physical count for a variant.'))
    .requiredOption('--variant <id>', 'Variant ID.')
    .action((values: Record<string, unknown>) => {
      command = {
        action: 'stock set',
        ...writeFlags(values),
        variant: variantIdOf(values.variant),
        copies: copiesOf(required(values.copies, 'copies')),
      };
    });

  for (const leaf of [whoami, create, setup, set]) {
    for (const option of leaf.options) {
      const flag = option.long;
      if (!flag) continue;
      let seen = false;
      leaf.on(`option:${option.name()}`, (value: unknown) => {
        if (seen) throw new OpsError(`Invalid or repeated option ${flag}.`);
        seen = true;
        // Commander can consume a following flag as a required value. Keep dash-prefixed values explicit.
        if (
          option.required &&
          typeof value === 'string' &&
          value.length > 1 &&
          value.startsWith('-') &&
          args.includes(flag)
        ) {
          throw new OpsError(`Supply ${flag} values beginning with a dash as ${flag}=value.`);
        }
      });
    }
  }

  program.parse(args.length ? args : ['--help'], { from: 'user' });
  if (!command) throw new OpsError('Unknown command. Run pnpm ops --help.');
  return command;
}
