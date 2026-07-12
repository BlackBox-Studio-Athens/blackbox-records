import { describe, expect, it } from 'vitest';

import { verifyReviewSiteMarkerSources } from '../../../../scripts/verify-environment-model';

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

describe('environment model verifier', () => {
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
