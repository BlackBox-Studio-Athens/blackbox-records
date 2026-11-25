import { parseArgs, type ParseArgsOptionsConfig } from 'node:util';
import { DISTRO_GROUP_VALUES, type DistroGroupName } from '@blackbox/content-model';

export class OpsError extends Error {}

export type OperatorEnvironment = 'uat' | 'prd';
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

type WriteOptions = { env: OperatorEnvironment; apply: boolean; confirmLive: boolean };
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
type Command =
  | WriteCommand
  | { action: 'login'; env: OperatorEnvironment }
  | { action: 'whoami'; env: OperatorEnvironment }
  | { action: 'help' };

const stringOption = { type: 'string' } as const;
const booleanOption = { type: 'boolean' } as const;
const envOptions = { env: stringOption };
const writeOptions = { ...envOptions, apply: booleanOption, 'confirm-live': booleanOption };
const distroOptions = { ...writeOptions, price: stringOption, copies: stringOption, publish: booleanOption };

function parseOptions(args: string[], options: ParseArgsOptionsConfig) {
  try {
    const parsed = parseArgs({ args, options, tokens: true });
    const seen = new Set<string>();
    for (const token of parsed.tokens) {
      if (token.kind !== 'option' || seen.has(token.name)) throw new Error();
      seen.add(token.name);
    }
    return parsed.values;
  } catch {
    throw new OpsError('Invalid or repeated option. Run pnpm ops --help.');
  }
}

function required(value: unknown, flag: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new OpsError(`--${flag} is required.`);
  return value;
}

function writeFlags(values: ReturnType<typeof parseOptions>): WriteOptions {
  return {
    env: environmentOf(values.env),
    apply: values.apply === true,
    confirmLive: values['confirm-live'] === true,
  };
}

function distroFlags(values: ReturnType<typeof parseOptions>): DistroOptions {
  return {
    ...writeFlags(values),
    price: euroMinorOf(required(values.price, 'price').trim()),
    copies: copiesOf(required(values.copies, 'copies')),
    publish: values.publish === true,
  };
}

export function parseCommand(args: string[]): Command {
  const [group, action, ...options] = args;
  if (!args.length || (group === '--help' && args.length === 1)) return { action: 'help' };
  if (group === 'login' && args.length === 2) {
    if (action !== 'uat' && action !== 'prd') throw new OpsError('Use pnpm ops login <uat|prd>.');
    return { action: 'login', env: environmentOf(action) };
  }
  if (group === 'whoami') {
    return { action: 'whoami', env: environmentOf(parseOptions(args.slice(1), envOptions).env) };
  }
  if (group === 'stock' && action === 'set') {
    const values = parseOptions(options, { ...writeOptions, variant: stringOption, copies: stringOption });
    return {
      action: 'stock set',
      ...writeFlags(values),
      variant: variantIdOf(values.variant),
      copies: copiesOf(required(values.copies, 'copies')),
    };
  }
  if (group === 'distro' && action === 'setup') {
    const values = parseOptions(options, { ...distroOptions, id: stringOption });
    return { action: 'distro setup', ...distroFlags(values), id: cmsIdOf(values.id) };
  }
  if (group === 'distro' && action === 'create') {
    const values = parseOptions(options, {
      ...distroOptions,
      title: stringOption,
      artist: stringOption,
      format: stringOption,
      image: stringOption,
      alt: stringOption,
      summary: stringOption,
      condition: stringOption,
    });
    const condition = values.condition;
    if (condition !== 'new' && condition !== 'used') throw new OpsError('Choose --condition new or --condition used.');
    return {
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
  }
  throw new OpsError('Unknown command. Run pnpm ops --help.');
}
