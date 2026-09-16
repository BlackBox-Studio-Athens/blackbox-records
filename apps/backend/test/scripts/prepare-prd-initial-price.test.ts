import { describe, expect, it } from 'vitest';
import { requireInitialPriceApproval } from '../../scripts/prepare-prd-initial-price';

describe('one-run initial live Price approval', () => {
  it('allows read-only planning and rejects mutation without both confirmation and the exact reviewed identity', () => {
    const sha = 'a'.repeat(64);
    expect(() => requireInitialPriceApproval(false, false, undefined, sha)).not.toThrow();
    expect(() => requireInitialPriceApproval(true, false, sha, sha)).toThrow();
    expect(() => requireInitialPriceApproval(true, true, undefined, sha)).toThrow();
    expect(() => requireInitialPriceApproval(true, true, 'b'.repeat(64), sha)).toThrow();
    expect(() => requireInitialPriceApproval(true, true, sha, sha)).not.toThrow();
  });
});
