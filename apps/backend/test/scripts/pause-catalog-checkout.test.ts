import { describe, expect, it } from 'vitest';

import {
  createPauseCatalogCheckoutSql,
  formatPauseCatalogCheckoutReport,
  parsePauseCatalogCheckoutArgs,
} from '../../../../scripts/pause-catalog-checkout';

describe('catalog checkout pause command', () => {
  it('parses dry-run and apply arguments', () => {
    expect(parsePauseCatalogCheckoutArgs(['--variant-id', 'variant_demo_standard'])).toEqual({
      apply: false,
      environment: 'prd',
      variantId: 'variant_demo_standard',
    });
    expect(parsePauseCatalogCheckoutArgs(['--env=uat', '--variant-id=variant_demo_standard', '--apply'])).toEqual({
      apply: true,
      environment: 'uat',
      variantId: 'variant_demo_standard',
    });
    expect(parsePauseCatalogCheckoutArgs(['--env=sandbox', '--variant-id=variant_demo_standard'])).toMatchObject({
      environment: 'uat',
    });
    expect(parsePauseCatalogCheckoutArgs(['--env=production', '--variant-id=variant_demo_standard'])).toMatchObject({
      environment: 'prd',
    });
  });

  it('pauses checkout only through ItemAvailability', () => {
    const sql = createPauseCatalogCheckoutSql("variant_demo_'_standard");

    expect(sql).toContain('UPDATE "ItemAvailability"');
    expect(sql).toContain('"status" = \'sold_out\'');
    expect(sql).toContain('"canBuy" = FALSE');
    expect(sql).toContain("'variant_demo_''_standard'");
    expect(sql).not.toContain('DELETE');
    expect(sql).not.toContain('Stripe');
    expect(sql).not.toContain('Stock');
  });

  it('reports that provider, order, stock, and evidence rows are preserved', () => {
    expect(
      formatPauseCatalogCheckoutReport({
        apply: false,
        environment: 'prd',
        variantId: 'variant_demo_standard',
      }),
    ).toContain('Stripe Products, Stripe Prices, orders, stock rows, and evidence are not deleted');
  });
});
