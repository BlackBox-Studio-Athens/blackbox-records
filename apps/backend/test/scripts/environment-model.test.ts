import { describe, expect, it } from 'vitest';

import { verifyReviewSiteMarkerSources } from '../../../../scripts/verify-environment-model';

const validSources = {
  envDeclaration: "readonly SHOW_REVIEW_SITE_MARKER?: 'true';",
  header:
    "const showReviewSiteMarker = import.meta.env.SHOW_REVIEW_SITE_MARKER === 'true'; Review site · test payments",
  holdingWorkflow: 'run: pnpm build',
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
