import { parse } from 'yaml';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import { currentDesiredCatalogEntries } from '../apps/backend/src/application/commerce/catalog-sync/desired-catalog-state';

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
const uatStaticHost = 'https://blackbox-records-web-uat.pages.dev';
const prdStaticHost = 'https://blackbox-records-web.pages.dev';
const prdPreviewHostFragment = '.blackbox-records-web.pages.dev';
const retiredPrdControlName = ['PRD', 'OPEN', 'GATE'].join('_');
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
  const catalogPromotionWorkflow = staticDeployWorkflow;
  const uatSandboxSmokeWorkflow = read('.github/workflows/uat-smoke.yml');
  const wranglerConfig = read('apps/backend/wrangler.jsonc');

  const catalogVerifyScript = read('scripts/stripe-catalog-verify.ts');

  return [
    {
      detail: 'One release workflow handles content-only and mixed commits while preserving manual dispatch.',
      ok: verifyStaticDeployTriggerSources(staticDeployWorkflow),
    },
    {
      detail: 'Shared static deployment workflow deploys UAT to Cloudflare Pages with UAT_PUBLIC_BACKEND_BASE_URL.',
      ok:
        staticDeployWorkflow.includes('Release BlackBox') &&
        staticDeployWorkflow.includes('Deploy UAT to Cloudflare Pages') &&
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
        staticDeployWorkflow.includes('Deploy PRD static frontend to Cloudflare Pages') &&
        staticDeployWorkflow.includes('PRD_PUBLIC_BACKEND_BASE_URL') &&
        staticDeployWorkflow.includes('--project-name=blackbox-records-web --branch=main') &&
        !staticDeployWorkflow.includes('pages/**') &&
        !staticDeployWorkflow.includes('--branch=${{ github.ref_name }}') &&
        !exists('.github/workflows/cloudflare-pages.yml'),
    },
    {
      detail:
        'Catalog promotion uses one-run confirmation for PRD catalog/D1 changes without deploying shopper runtime.',
      ok:
        catalogPromotionWorkflow.includes('options: [uat, prd]') &&
        !catalogPromotionWorkflow.includes('- production') &&
        catalogPromotionWorkflow.includes('catalog-promotion-prd') &&
        catalogPromotionWorkflow.includes('confirm_live_catalog_changes:') &&
        catalogPromotionWorkflow.includes('default: false') &&
        catalogPromotionWorkflow.includes('--confirm-live-catalog-changes') &&
        catalogPromotionWorkflow.includes('!inputs.confirm_code_promotion') &&
        !catalogPromotionWorkflow.includes(retiredPrdControlName) &&
        !catalogPromotionWorkflow.includes('- name: Deploy PRD Worker') &&
        !catalogPromotionWorkflow.includes('-f target=prd'),
    },
    {
      detail: 'Catalog promotion owns UAT Worker deployment while post-merge provider smoke remains observation-only.',
      ok:
        catalogPromotionWorkflow.includes('- name: Deploy UAT Worker') &&
        staticDeployWorkflow.includes('Run UAT provider smoke') &&
        staticDeployWorkflow.includes('cancel-in-progress: false') &&
        !uatSandboxSmokeWorkflow.includes('pnpm deploy:backend:uat') &&
        !uatSandboxSmokeWorkflow.includes('d1:migrations:apply:uat') &&
        !exists('.github/workflows/cloudflare-uat.yml') &&
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
      detail: 'UAT Worker checkout origins allow Cloudflare Pages plus local uat-connected diagnostics only.',
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
        catalogVerifyScript.includes('catalogManifest.entries'),
    },
    {
      detail: 'Raw platform/provider aliases stay out of product-policy modules outside approved boundaries.',
      ok: findRawPlatformAliasPolicyLeaks().length === 0,
    },
    {
      detail: 'Generated Desired Catalog State does not combine production targets with UAT-hosted Product image URLs.',
      ok: !hasProductionTargetWithUatAssetUrl(),
    },
    {
      detail: 'UAT and PRD deploy to distinct Cloudflare Pages projects.',
      ok:
        staticDeployWorkflow.includes('--project-name=blackbox-records-web-uat --branch=main') &&
        staticDeployWorkflow.includes('--project-name=blackbox-records-web --branch=main'),
    },
  ];
}

export function verifyStaticDeployTriggerSources(staticDeployWorkflow: string): boolean {
  try {
    const workflow = parse(staticDeployWorkflow);
    const push = workflow.on?.push;
    return (
      JSON.stringify(push?.branches) === JSON.stringify(['main']) &&
      JSON.stringify(push?.['paths-ignore']) === JSON.stringify(['docs/**', 'openspec/**', '*.md', 'LICENSE']) &&
      Object.hasOwn(workflow.on ?? {}, 'workflow_dispatch') &&
      !/commit.?message|head_commit|github\.event\.commits/i.test(staticDeployWorkflow)
    );
  } catch {
    return false;
  }
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

function hasProductionTargetWithUatAssetUrl(): boolean {
  return currentDesiredCatalogEntries.some(
    (entry) =>
      entry.targetEnvironments.includes('prd') &&
      entry.productProjection.imageUrls.some((url) => url.startsWith('https://blackbox-records-web-uat.pages.dev')),
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
