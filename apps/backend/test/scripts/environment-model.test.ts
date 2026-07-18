import { describe, expect, it } from 'vitest';

import {
  verifyReviewSiteMarkerSources,
  verifyStaticDeployTriggerSources,
} from '../../../../scripts/verify-environment-model';

const validSources = {
  checkoutRoutes: [
    "showReviewSiteMarker={import.meta.env.SHOW_REVIEW_SITE_MARKER === 'true'}",
    "showReviewSiteMarker={import.meta.env.SHOW_REVIEW_SITE_MARKER === 'true'}",
  ].join('\n'),
  checkoutStatus:
    'showReviewSiteMarker view.canStartCheckout && shippingGateView.canContinueToPayment && hasCheckoutLine Test checkout. No real payment will be taken. <Button',
  envDeclaration: "readonly SHOW_REVIEW_SITE_MARKER?: 'true';",
  header: "import.meta.env.SHOW_REVIEW_SITE_MARKER === 'true'; TEST SITE Test payments only",
  holdingWorkflow: 'run: pnpm build',
  siteLayout:
    "const showReviewSiteMarker = import.meta.env.SHOW_REVIEW_SITE_MARKER === 'true'; const htmlTitle = `[TEST] ${baseHtmlTitle}`;",
  staticDeployWorkflow: [
    '- name: Build UAT static frontend',
    '  env:',
    "    SHOW_REVIEW_SITE_MARKER: 'true'",
    '  run: pnpm build:web',
  ].join('\n'),
};

const validStaticDeployTrigger = [
  'on:',
  '  push:',
  "    branches: ['main']",
  '    paths-ignore:',
  "      - 'docs/**'",
  "      - 'openspec/**'",
  "      - 'apps/web/src/content/distro/**'",
  "      - 'apps/web/src/content/releases/**'",
  "      - 'apps/web/src/content/uploads/**'",
  "      - 'apps/web/src/lib/admin/**'",
  "      - 'apps/web/src/content.config.ts'",
  "      - 'scripts/stripe-catalog-contract.ts'",
  "      - 'scripts/generate-stripe-uat-catalog-artifacts.ts'",
  "      - 'apps/backend/src/application/commerce/catalog-sync/catalog-product-projections.ts'",
  "      - 'apps/backend/src/application/commerce/catalog-sync/desired-catalog-state.ts'",
  "      - 'apps/backend/prisma/seeds/uat-commerce-state.sql'",
  "      - 'apps/backend/prisma/seeds/prd-commerce-readiness.sql'",
  "      - '*.md'",
  "      - 'LICENSE'",
  '  workflow_dispatch:',
].join('\n');

describe('environment model verifier', () => {
  it('accepts only the narrow static deployment trigger contract', () => {
    expect(verifyStaticDeployTriggerSources(validStaticDeployTrigger)).toBe(true);
    expect(verifyStaticDeployTriggerSources(validStaticDeployTrigger.replace("- '*.md'", "- '**/*.md'"))).toBe(false);
    expect(
      verifyStaticDeployTriggerSources(
        validStaticDeployTrigger.replace("      - 'LICENSE'", "      - 'LICENSE'\n      - 'apps/**'"),
      ),
    ).toBe(false);
    expect(verifyStaticDeployTriggerSources(validStaticDeployTrigger.replace('  push:\n', ''))).toBe(false);
    expect(
      verifyStaticDeployTriggerSources(validStaticDeployTrigger.replace("branches: ['main']", "branches: ['develop']")),
    ).toBe(false);
    expect(verifyStaticDeployTriggerSources(validStaticDeployTrigger.replace('  workflow_dispatch:', ''))).toBe(false);
    expect(
      verifyStaticDeployTriggerSources(
        validStaticDeployTrigger + "\nif: ${{ contains(github.event.head_commit.message, 'docs') }}",
      ),
    ).toBe(false);
  });

  it('accepts only the private exact UAT Review Site Marker contract', () => {
    expect(verifyReviewSiteMarkerSources(validSources)).toBe(true);
    expect(
      verifyReviewSiteMarkerSources({
        ...validSources,
        staticDeployWorkflow: validSources.staticDeployWorkflow.replace("'true'", "'false'"),
      }),
    ).toBe(false);
    expect(
      verifyReviewSiteMarkerSources({
        ...validSources,
        holdingWorkflow: 'SHOW_REVIEW_SITE_MARKER: true',
      }),
    ).toBe(false);
  });
});
