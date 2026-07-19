import { describe, expect, it } from 'vitest';

import { resolveSupportingLabel } from './page-identity';

describe('page identity', () => {
  it('omits empty or equivalent supporting labels after case and whitespace normalization', () => {
    expect(resolveSupportingLabel(undefined, 'Services')).toBeUndefined();
    expect(resolveSupportingLabel('   ', 'Services')).toBeUndefined();
    expect(resolveSupportingLabel('  What   We Do  ', 'what we do')).toBeUndefined();
  });

  it('preserves distinct authored supporting labels', () => {
    expect(resolveSupportingLabel('  What   We Do  ', 'Services')).toBe('  What   We Do  ');
  });
});
