import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

type CheckResult = {
  detail: string;
  ok: boolean;
};

const rootDir = process.cwd();
const uatStaticHost = 'https://blackbox-studio-athens.github.io/blackbox-records';
const prdStaticHost = 'https://blackbox-records-web.pages.dev';
const prdPreviewHostFragment = '.blackbox-records-web.pages.dev';

function read(relativePath: string): string {
  return readFileSync(path.join(rootDir, ...relativePath.split('/')), 'utf8');
}

export function verifyEnvironmentModel(): CheckResult[] {
  const pagesWorkflow = read('.github/workflows/pages.yml');
  const cloudflarePagesWorkflow = read('.github/workflows/cloudflare-pages.yml');
  const catalogPromotionWorkflow = read('.github/workflows/catalog-promotion.yml');
  const wranglerConfig = read('apps/backend/wrangler.jsonc');
  const staticSiteSpec = read('openspec/specs/static-site-and-deployment/spec.md');
  const catalogVerifyScript = read('scripts/stripe-catalog-verify.ts');
  const desiredCatalogState = read('apps/backend/src/application/commerce/catalog-sync/desired-catalog-state.ts');

  return [
    {
      detail: 'GitHub Pages workflow is the UAT static deployment and uses UAT_PUBLIC_BACKEND_BASE_URL.',
      ok:
        pagesWorkflow.includes('Deploy UAT static site to GitHub Pages') &&
        pagesWorkflow.includes('UAT_PUBLIC_BACKEND_BASE_URL') &&
        !pagesWorkflow.includes('PUBLIC_BACKEND_BASE_URL="${{ vars.PUBLIC_BACKEND_BASE_URL }}"'),
    },
    {
      detail:
        'Cloudflare Pages workflow is the PRD static deployment and does not create branch or preview product deploys.',
      ok:
        cloudflarePagesWorkflow.includes('Deploy PRD static site to Cloudflare Pages') &&
        cloudflarePagesWorkflow.includes('PRD_PUBLIC_BACKEND_BASE_URL') &&
        !cloudflarePagesWorkflow.includes('pages/**') &&
        !cloudflarePagesWorkflow.includes('--branch=${{ github.ref_name }}'),
    },
    {
      detail: 'Catalog promotion exposes PRD at the operator boundary and gates live provider mutation.',
      ok:
        catalogPromotionWorkflow.includes('- prd') &&
        !catalogPromotionWorkflow.includes('- production') &&
        catalogPromotionWorkflow.includes('catalog-promotion-prd') &&
        catalogPromotionWorkflow.includes('PRD_OPEN_GATE') &&
        catalogPromotionWorkflow.includes('prd-not-configured.txt'),
    },
    {
      detail: 'Local Worker checkout origins stay local-only.',
      ok: hasCheckoutOrigins(
        wranglerConfig,
        'local-root',
        ['http://127.0.0.1:4321', 'http://localhost:4321'],
        [uatStaticHost, prdStaticHost, prdPreviewHostFragment],
      ),
    },
    {
      detail: 'UAT Worker checkout origins allow GitHub Pages plus local uat-connected diagnostics only.',
      ok: hasCheckoutOrigins(
        wranglerConfig,
        'sandbox',
        ['http://127.0.0.1:4321', 'http://localhost:4321', uatStaticHost],
        [prdStaticHost, prdPreviewHostFragment],
      ),
    },
    {
      detail: 'PRD Worker checkout origins allow Cloudflare Pages PRD only.',
      ok: hasCheckoutOrigins(
        wranglerConfig,
        'production',
        [prdStaticHost],
        ['http://127.0.0.1:4321', 'http://localhost:4321', uatStaticHost, prdPreviewHostFragment],
      ),
    },
    {
      detail: 'Production catalog verification uses PRD catalog asset URLs.',
      ok: catalogVerifyScript.includes("productEnvironment: options.environment === 'production' ? 'prd' : 'uat'"),
    },
    {
      detail: 'Generated Desired Catalog State does not combine production targets with UAT-hosted Product image URLs.',
      ok: !hasProductionTargetWithUatAssetUrl(desiredCatalogState),
    },
    {
      detail: 'Static-site baseline spec no longer names GitHub Pages as rollback/legacy production.',
      ok:
        !/rollback\/legacy|GitHub Pages rollback|canonical target/i.test(staticSiteSpec) &&
        staticSiteSpec.includes('GitHub Pages as the only UAT static host') &&
        staticSiteSpec.includes('Cloudflare Pages as the only PRD static host'),
    },
  ];
}

function hasCheckoutOrigins(
  wranglerConfig: string,
  environment: 'local-root' | 'production' | 'sandbox',
  requiredOrigins: string[],
  forbiddenOrigins: string[],
): boolean {
  const block =
    environment === 'local-root'
      ? extractLocalRootBlock(wranglerConfig)
      : extractNamedBlock(wranglerConfig, environment);
  const origins = extractCheckoutOrigins(block);

  return (
    requiredOrigins.every((origin) => origins.includes(origin)) &&
    forbiddenOrigins.every((origin) => !block.includes(origin))
  );
}

function extractLocalRootBlock(wranglerConfig: string): string {
  const envIndex = wranglerConfig.indexOf('"env"');
  return envIndex === -1 ? wranglerConfig : wranglerConfig.slice(0, envIndex);
}

function extractNamedBlock(text: string, marker: string): string {
  const markerIndex = text.indexOf(`"${marker}"`);
  if (markerIndex === -1) return '';

  const blockStart = text.indexOf('{', markerIndex);
  if (blockStart === -1) return '';

  let depth = 0;
  for (let index = blockStart; index < text.length; index += 1) {
    if (text[index] === '{') depth += 1;
    if (text[index] === '}') depth -= 1;
    if (depth === 0) return text.slice(blockStart, index + 1);
  }

  return '';
}

function extractCheckoutOrigins(block: string): string[] {
  const match = /"CHECKOUT_RETURN_ORIGINS"\s*:\s*"(?<origins>[^"]*)"/.exec(block);
  return match?.groups?.origins.split(',').map((origin) => origin.trim()) ?? [];
}

function hasProductionTargetWithUatAssetUrl(desiredCatalogState: string): boolean {
  return /targetEnvironments:\s*\[[^\]]*'production'[\s\S]*?https:\/\/blackbox-studio-athens\.github\.io\/blackbox-records/.test(
    desiredCatalogState,
  );
}

function main(): void {
  const results = verifyEnvironmentModel();
  const failures = results.filter((result) => !result.ok);

  for (const result of results) {
    console.log(`${result.ok ? 'OK' : 'FAIL'}: ${result.detail}`);
  }

  if (failures.length) {
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
