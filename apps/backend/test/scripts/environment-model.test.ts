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
  header:
    "import.meta.env.SHOW_REVIEW_SITE_MARKER === 'true'; UAT · TESTING ONLY Data here is separate and does not transfer to or from the production site. https://blackbox-records-web.pages.dev/",
  siteLayout:
    "const showReviewSiteMarker = import.meta.env.SHOW_REVIEW_SITE_MARKER === 'true'; const htmlTitle = `[UAT] ${baseHtmlTitle}`;",
};

describe('environment model verifier', () => {
  it('accepts only the private exact UAT Review Site Marker contract', () => {
    expect(verifyReviewSiteMarkerSources(validSources)).toBe(true);
    expect(
      verifyReviewSiteMarkerSources({
        ...validSources,
        header: validSources.header.replace('UAT · TESTING ONLY', 'TESTING'),
      }),
    ).toBe(false);
    expect(
      verifyReviewSiteMarkerSources({
        ...validSources,
        siteLayout: validSources.siteLayout.replace('SHOW_REVIEW_SITE_MARKER', 'PUBLIC_SHOW_REVIEW_SITE_MARKER'),
      }),
    ).toBe(false);
  });
});
