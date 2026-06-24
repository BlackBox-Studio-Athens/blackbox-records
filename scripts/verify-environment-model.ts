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
const productPolicyFiles = [
  'apps/backend/src/application/email/config.ts',
  'apps/backend/src/application/email/routing.ts',
  'apps/backend/src/application/email/idempotency.ts',
  'apps/backend/src/infrastructure/feature-flags/cloudflare-feature-flag-reader.ts',
  'apps/backend/src/interfaces/scheduled/catalog-verification.ts',
  'apps/backend/src/interfaces/http/routes/public-commerce-services.ts',
  'apps/backend/src/interfaces/http/routes/stripe-webhook-services.ts',
  'scripts/verify-runtime-config.ts',
];

function read(relativePath: string): string {
  return readFileSync(path.join(rootDir, ...relativePath.split('/')), 'utf8');
}

export function verifyEnvironmentModel(): CheckResult[] {
  const pagesWorkflow = read('.github/workflows/pages.yml');
  const cloudflarePagesWorkflow = read('.github/workflows/cloudflare-pages.yml');
  const catalogPromotionWorkflow = read('.github/workflows/catalog-promotion.yml');
  const uatSandboxSmokeWorkflow = read('.github/workflows/uat-smoke.yml');
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
      detail:
        'Catalog promotion exposes PRD at the operator boundary and gates live provider mutation without smoke steps.',
      ok:
        catalogPromotionWorkflow.includes('- prd') &&
        !catalogPromotionWorkflow.includes('- production') &&
        catalogPromotionWorkflow.includes('catalog-promotion-prd') &&
        catalogPromotionWorkflow.includes('PRD_OPEN_GATE') &&
        catalogPromotionWorkflow.includes('prd-not-configured.txt') &&
        !catalogPromotionWorkflow.includes('pnpm smoke:') &&
        !catalogPromotionWorkflow.includes('.codex-artifacts/smoke/'),
    },
    {
      detail:
        'Post-merge UAT provider smoke runs after the GitHub Pages deploy, deploys the UAT Worker, and reuses the UAT promotion credential scope.',
      ok:
        uatSandboxSmokeWorkflow.includes('workflow_run') &&
        uatSandboxSmokeWorkflow.includes('Deploy UAT static site to GitHub Pages') &&
        uatSandboxSmokeWorkflow.includes("branches: ['main']") &&
        uatSandboxSmokeWorkflow.includes('types: [completed]') &&
        uatSandboxSmokeWorkflow.includes('concurrency:') &&
        uatSandboxSmokeWorkflow.includes('environment: catalog-promotion-uat') &&
        uatSandboxSmokeWorkflow.includes('github.event.workflow_run.head_sha') &&
        uatSandboxSmokeWorkflow.includes('pnpm deploy:backend:uat') &&
        uatSandboxSmokeWorkflow.includes('pnpm smoke:stripe-uat -- \\') &&
        uatSandboxSmokeWorkflow.includes('pnpm smoke:resend-uat -- \\') &&
        uatSandboxSmokeWorkflow.includes('--site-url "${UAT_SITE_URL}"') &&
        uatSandboxSmokeWorkflow.includes('--worker-url "${UAT_WORKER_URL}"') &&
        uatSandboxSmokeWorkflow.includes('--scenario happy_path_paid') &&
        uatSandboxSmokeWorkflow.includes('--screenshots on-failure') &&
        uatSandboxSmokeWorkflow.includes('.codex-artifacts/smoke/uat/stripe-sandbox/**') &&
        uatSandboxSmokeWorkflow.includes('.codex-artifacts/smoke/uat/resend-uat/**'),
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
        'uat',
        ['http://127.0.0.1:4321', 'http://localhost:4321', uatStaticHost],
        [prdStaticHost, prdPreviewHostFragment],
      ),
    },
    {
      detail: 'PRD Worker checkout origins allow Cloudflare Pages PRD only.',
      ok: hasCheckoutOrigins(
        wranglerConfig,
        'prd',
        [prdStaticHost],
        ['http://127.0.0.1:4321', 'http://localhost:4321', uatStaticHost, prdPreviewHostFragment],
      ),
    },
    {
      detail: 'Production catalog verification uses PRD catalog asset URLs.',
      ok:
        catalogVerifyScript.includes('parseProductEnvironmentCliTarget') &&
        catalogVerifyScript.includes('productEnvironmentProfileFromWorkerRuntimeTarget') &&
        catalogVerifyScript.includes("productEnvironmentProfile.productEnvironment === 'PRD' ? 'PRD' : 'UAT'"),
    },
    {
      detail: 'Raw platform/provider aliases stay out of product-policy modules outside approved boundaries.',
      ok: findRawPlatformAliasPolicyLeaks().length === 0,
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

function findRawPlatformAliasPolicyLeaks(): string[] {
  const rawAliasBranchPattern =
    /\b(?:appEnvironment|environment|PRODUCT_ENVIRONMENT|bindings\.PRODUCT_ENVIRONMENT)\s*(?:={2,3}|!={1,2})\s*['"`](?:sandbox|production|test|live)['"`]/;

  return productPolicyFiles.flatMap((relativePath) => {
    const text = read(relativePath);
    const lines = text.split(/\r?\n/);

    return lines.flatMap((line, index) => (rawAliasBranchPattern.test(line) ? [`${relativePath}:${index + 1}`] : []));
  });
}

function hasCheckoutOrigins(
  wranglerConfig: string,
  environment: 'local-root' | 'prd' | 'uat',
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
    forbiddenOrigins.every((origin) => !origins.some((checkoutOrigin) => checkoutOrigin.includes(origin)))
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
  return /targetEnvironments:\s*\[[^\]]*'prd'[\s\S]*?https:\/\/blackbox-studio-athens\.github\.io\/blackbox-records/.test(
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
