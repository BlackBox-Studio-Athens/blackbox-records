import process from 'node:process';
import { pathToFileURL } from 'node:url';

import { loadStripeCatalogStoreItemContracts } from './stripe-catalog-contract';

type ListingPriceRecord = {
  displayPrice?: unknown;
  presentationState?: unknown;
  storeItemSlug?: unknown;
};

export function findNonReadyStoreItemSlugs(expectedSlugs: string[], payload: unknown): string[] {
  const records = Array.isArray(payload) ? (payload as ListingPriceRecord[]) : [];

  return expectedSlugs.filter((slug) => {
    const matches = records.filter((record) => record.storeItemSlug === slug);
    return (
      matches.length !== 1 ||
      matches[0]?.presentationState !== 'ready' ||
      typeof matches[0]?.displayPrice !== 'string' ||
      matches[0].displayPrice.trim() === ''
    );
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const contracts = await loadStripeCatalogStoreItemContracts({
    productEnvironment: options.environment === 'prd' ? 'PRD' : 'UAT',
  });
  const response = await fetch(options.url, { headers: { Accept: 'application/json' } });

  if (!response.ok) {
    throw new Error(`Hosted listing-price readiness request failed (${response.status}).`);
  }

  const failingSlugs = findNonReadyStoreItemSlugs(
    contracts.map((contract) => contract.storeItemSlug),
    await response.json(),
  );

  if (failingSlugs.length > 0) {
    throw new Error(`Hosted listing prices are not ready: ${failingSlugs.join(', ')}.`);
  }

  console.log(`Hosted listing prices ready: ${contracts.length} Store Items.`);
}

function parseArgs(args: string[]): { environment: 'prd' | 'uat'; url: string } {
  let environment: 'prd' | 'uat' | null = null;
  let url = '';

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--') continue;
    if (arg === '--env') environment = parseEnvironment(args[++index]);
    else if (arg === '--url') url = args[++index]?.trim() ?? '';
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!environment || !url.startsWith('https://')) {
    throw new Error('Usage: --env uat|prd --url https://worker.example/api/store/listing-prices');
  }

  return { environment, url };
}

function parseEnvironment(value: string | undefined): 'prd' | 'uat' {
  if (value === 'uat' || value === 'prd') return value;
  throw new Error('--env must be uat or prd.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
