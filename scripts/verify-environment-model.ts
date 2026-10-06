import { readFileSync } from 'node:fs';
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
  siteLayout: string;
};

const rootDir = process.cwd();
const uatStaticHost = 'https://blackbox-records-web-uat.pages.dev';
const prdStaticHost = 'https://blackbox-records-web.pages.dev';
const prdPreviewHostFragment = '.blackbox-records-web.pages.dev';
const productPolicyFiles = [
  'apps/backend/src/application/email/config.ts',
  'apps/backend/src/application/email/routing.ts',
  'apps/backend/src/application/email/idempotency.ts',
  'apps/backend/src/application/commerce/checkout/feature-flags/cloudflare-feature-flag-reader.ts',
  'apps/backend/src/interfaces/http/routes/public-commerce-services.ts',
  'apps/backend/src/interfaces/http/routes/stripe-webhook-services.ts',
  'scripts/verify-runtime-config.ts',
];

function read(relativePath: string): string {
  return readFileSync(path.join(rootDir, ...relativePath.split('/')), 'utf8');
}

// Source-level policy only. The release workflows are not pinned here: the renderer build sets the Review Site
// Marker for UAT, and `release-candidate.mjs verify-hosted` asserts it on the deployed page.
export function verifyEnvironmentModel(): CheckResult[] {
  const envDeclaration = read('apps/web/src/env.d.ts');
  const header = read('apps/web/src/components/Header.astro');
  const siteLayout = read('apps/web/src/layouts/SiteLayout.astro');
  const checkoutStatus = read('apps/web/src/components/store/checkout/CheckoutOfferStatus.tsx');
  const checkoutRoutes = [
    read('apps/web/src/pages/store/checkout/index.astro'),
    read('apps/web/src/pages/store/[slug]/checkout/index.astro'),
  ].join('\n');
  const wranglerConfig = read('apps/backend/wrangler.jsonc');

  const catalogVerifyScript = read('scripts/stripe-catalog-verify.ts');

  return [
    {
      detail: 'Layered Review Site Marker cues are private and exact.',
      ok: verifyReviewSiteMarkerSources({ checkoutRoutes, checkoutStatus, envDeclaration, header, siteLayout }),
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
        catalogVerifyScript.includes('loadStripeCatalogStoreItemContracts'),
    },
    {
      detail: 'Raw platform/provider aliases stay out of product-policy modules outside approved boundaries.',
      ok: findRawPlatformAliasPolicyLeaks().length === 0,
    },
  ];
}

export function verifyReviewSiteMarkerSources({
  checkoutRoutes,
  checkoutStatus,
  envDeclaration,
  header,
  siteLayout,
}: ReviewSiteMarkerSources): boolean {
  return (
    envDeclaration.includes("readonly SHOW_REVIEW_SITE_MARKER?: 'true';") &&
    header.includes("import.meta.env.SHOW_REVIEW_SITE_MARKER === 'true'") &&
    header.includes('UAT · TESTING ONLY') &&
    header.includes('Data here is separate and does not transfer to or from the production site.') &&
    header.includes('https://blackbox-records-web.pages.dev/') &&
    siteLayout.includes("import.meta.env.SHOW_REVIEW_SITE_MARKER === 'true'") &&
    siteLayout.includes('`[UAT] ${baseHtmlTitle}`') &&
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
    !header.includes('Astro.url.hostname')
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
