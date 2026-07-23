import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

type CheckResult = {
  detail: string;
  ok: boolean;
};

type ReviewSiteMarkerSources = {
  checkoutRoutes: string;
  checkoutStatus: string;
  envDeclaration: string;
  header: string;
  holdingWorkflow: string;
  siteLayout: string;
  staticDeployWorkflow: string;
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
  'apps/backend/src/interfaces/http/routes/public-commerce-services.ts',
  'apps/backend/src/interfaces/http/routes/stripe-webhook-services.ts',
  'scripts/verify-runtime-config.ts',
];

function read(relativePath: string): string {
  return readFileSync(path.join(rootDir, ...relativePath.split('/')), 'utf8');
}

function exists(relativePath: string): boolean {
  return existsSync(path.join(rootDir, ...relativePath.split('/')));
}

export function verifyEnvironmentModel(): CheckResult[] {
  const staticDeployWorkflow = read('.github/workflows/pages.yml');
  const holdingWorkflow = read('.github/workflows/prd-holding-page.yml');
  const envDeclaration = read('apps/web/src/env.d.ts');
  const header = read('apps/web/src/components/Header.astro');
  const siteLayout = read('apps/web/src/layouts/SiteLayout.astro');
  const checkoutStatus = read('apps/web/src/components/store/CheckoutOfferStatus.tsx');
  const checkoutRoutes = [
    read('apps/web/src/pages/store/checkout/index.astro'),
    read('apps/web/src/pages/store/[slug]/checkout/index.astro'),
  ].join('\n');
  const catalogPromotionWorkflow = read('.github/workflows/catalog-promotion.yml');
  const uatSandboxSmokeWorkflow = read('.github/workflows/uat-smoke.yml');
  const wranglerConfig = read('apps/backend/wrangler.jsonc');
  const staticSiteSpec = read('openspec/specs/static-site-and-deployment/spec.md');
  const catalogVerifyScript = read('scripts/stripe-catalog-verify.ts');
  const desiredCatalogState = read('apps/backend/src/application/commerce/catalog-sync/desired-catalog-state.ts');

  return [
    {
      detail:
        'Shared static deployment workflow skips audited documentation and catalog-promotion-owned inputs while preserving manual dispatch.',
      ok: verifyStaticDeployTriggerSources(staticDeployWorkflow),
    },
    {
      detail: 'Shared static deployment workflow deploys UAT to GitHub Pages with UAT_PUBLIC_BACKEND_BASE_URL.',
      ok:
        staticDeployWorkflow.includes('Deploy UAT and PRD static sites') &&
        staticDeployWorkflow.includes('Deploy UAT to GitHub Pages') &&
        staticDeployWorkflow.includes('UAT_PUBLIC_BACKEND_BASE_URL') &&
        !staticDeployWorkflow.includes('PUBLIC_BACKEND_BASE_URL="${{ vars.PUBLIC_BACKEND_BASE_URL }}"'),
    },
    {
      detail: 'Layered Review Site Marker cues are private, exact, and enabled only by the UAT static build step.',
      ok: verifyReviewSiteMarkerSources({
        checkoutRoutes,
        checkoutStatus,
        envDeclaration,
        header,
        holdingWorkflow,
        siteLayout,
        staticDeployWorkflow,
      }),
    },
    {
      detail:
        'Shared static deployment workflow deploys PRD to Cloudflare Pages without branch or preview product deploys.',
      ok:
        staticDeployWorkflow.includes('Deploy disabled PRD static frontend to Cloudflare Pages') &&
        staticDeployWorkflow.includes('PRD_PUBLIC_BACKEND_BASE_URL') &&
        staticDeployWorkflow.includes('--project-name=blackbox-records-web --branch=main') &&
        !staticDeployWorkflow.includes('pages/**') &&
        !staticDeployWorkflow.includes('--branch=${{ github.ref_name }}') &&
        !exists('.github/workflows/cloudflare-pages.yml'),
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
        'Post-merge UAT provider smoke runs after the shared static deployment workflow, deploys the UAT Worker, and reuses the UAT promotion credential scope.',
      ok:
        uatSandboxSmokeWorkflow.includes('workflow_run') &&
        uatSandboxSmokeWorkflow.includes('Deploy UAT and PRD static sites') &&
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

export function verifyStaticDeployTriggerSources(staticDeployWorkflow: string): boolean {
  const triggerEvents =
    /(?:^|\r?\n)on:\r?\n(?<events>[\s\S]*?)(?=\r?\n(?:permissions:|concurrency:|jobs:)|(?![\s\S]))/m.exec(
      staticDeployWorkflow,
    )?.groups?.events ?? '';
  const push =
    /^\x20{2}push:\r?\n(?<push>[\s\S]*?)(?=\r?\n\x20{2}workflow_dispatch:)/m.exec(triggerEvents)?.groups?.push ?? '';
  const ignoredPaths =
    /^\x20{4}paths-ignore:\r?\n(?<paths>(?:\x20{6}- '[^']+'\r?\n?)+)/m
      .exec(push)
      ?.groups?.paths?.split(/\r?\n/)
      .filter(Boolean)
      .map((line) => /^\s*-\s+'([^']+)'$/.exec(line)?.[1] ?? '') ?? [];
  const expectedIgnoredPaths = [
    'docs/**',
    'openspec/**',
    'apps/web/src/content/distro/**',
    'apps/web/src/content/releases/**',
    'apps/web/src/lib/admin/**',
    'apps/web/src/content.config.ts',
    'scripts/stripe-catalog-contract.ts',
    'scripts/generate-stripe-uat-catalog-artifacts.ts',
    'apps/backend/src/application/commerce/catalog-sync/catalog-product-projections.ts',
    'apps/backend/src/application/commerce/catalog-sync/desired-catalog-state.ts',
    'apps/backend/prisma/seeds/uat-commerce-state.sql',
    'apps/backend/prisma/seeds/prd-commerce-readiness.sql',
    '*.md',
    'LICENSE',
  ];

  return (
    /^\x20{2}push:\r?$/m.test(triggerEvents) &&
    /^\x20{4}branches: \['main'\]\r?$/m.test(push) &&
    ignoredPaths.length === expectedIgnoredPaths.length &&
    expectedIgnoredPaths.every((path, index) => ignoredPaths[index] === path) &&
    /^\x20{2}workflow_dispatch:\r?$/m.test(triggerEvents) &&
    !/commit.?message|head_commit|github\.event\.commits/i.test(staticDeployWorkflow)
  );
}

export function verifyReviewSiteMarkerSources({
  checkoutRoutes,
  checkoutStatus,
  envDeclaration,
  header,
  holdingWorkflow,
  siteLayout,
  staticDeployWorkflow,
}: ReviewSiteMarkerSources): boolean {
  const uatBuildStep = /- name: Build hosted UAT static frontend[\s\S]*?run: pnpm build:web/.exec(
    staticDeployWorkflow,
  )?.[0];
  return (
    envDeclaration.includes("readonly SHOW_REVIEW_SITE_MARKER?: 'true';") &&
    header.includes("import.meta.env.SHOW_REVIEW_SITE_MARKER === 'true'") &&
    header.includes('TEST SITE') &&
    header.includes('Test payments only') &&
    siteLayout.includes("import.meta.env.SHOW_REVIEW_SITE_MARKER === 'true'") &&
    siteLayout.includes('`[TEST] ${baseHtmlTitle}`') &&
    checkoutStatus.includes('showReviewSiteMarker') &&
    checkoutStatus.includes('Test checkout. No real payment will be taken.') &&
    checkoutStatus.indexOf('view.canStartCheckout && shippingGateView.canContinueToPayment && hasCheckoutLine') <
      checkoutStatus.indexOf('Test checkout. No real payment will be taken.') &&
    checkoutStatus.indexOf('Test checkout. No real payment will be taken.') <
      checkoutStatus.indexOf('<Button', checkoutStatus.indexOf('Test checkout. No real payment will be taken.')) &&
    (checkoutRoutes.match(/showReviewSiteMarker=\{import\.meta\.env\.SHOW_REVIEW_SITE_MARKER === 'true'\}/g) ?? [])
      .length === 2 &&
    !header.includes('PUBLIC_SHOW_REVIEW_SITE_MARKER') &&
    !siteLayout.includes('PUBLIC_SHOW_REVIEW_SITE_MARKER') &&
    !checkoutRoutes.includes('PUBLIC_SHOW_REVIEW_SITE_MARKER') &&
    !header.includes('Astro.url.hostname') &&
    uatBuildStep?.includes("SHOW_REVIEW_SITE_MARKER: 'true'") === true &&
    (staticDeployWorkflow.match(/SHOW_REVIEW_SITE_MARKER/g) ?? []).length === 1 &&
    !holdingWorkflow.includes('SHOW_REVIEW_SITE_MARKER')
  );
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
