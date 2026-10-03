import { env } from 'cloudflare:workers';
import { describe, expect, it, vi } from 'vitest';
import * as stripe from '../../../infrastructure/stripe';
import { PrismaStoreItemOptionRepository } from '../../../infrastructure/persistence/prisma';
import type { AppBindings } from '../../../platform/env';
import { createPublicCommerceServices } from './public-commerce-services';

describe('public offer provider limits', () => {
  it('uses a short timeout and zero retries for public reads while retaining checkout defaults', async () => {
    const gateway = vi.spyOn(stripe, 'createStripeCatalogGateway');
    const lookup = vi.spyOn(PrismaStoreItemOptionRepository.prototype, 'findByStoreItemSlug').mockResolvedValue(null);
    const bindings = {
      COMMERCE_DB: env.COMMERCE_DB,
      PRODUCT_ENVIRONMENT: 'LOCAL',
      STRIPE_SECRET_KEY: 'sk_test_mock',
      STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: 'pmc_mock',
    } satisfies AppBindings;
    const services = createPublicCommerceServices(bindings);
    try {
      await expect(services.readStoreOffer('missing')).resolves.toBeNull();
      expect(gateway).toHaveBeenLastCalledWith(bindings, { timeout: 3000, maxNetworkRetries: 0 });
      await expect(services.listVariantOffersForStoreItem('missing')).resolves.toBeNull();
      expect(gateway).toHaveBeenLastCalledWith(bindings, { timeout: 3000, maxNetworkRetries: 0 });
      await expect(services.startCheckout({ lines: [] } as never)).rejects.toThrow();
      expect(gateway).toHaveBeenLastCalledWith(bindings, {});
    } finally {
      await services.disconnect();
      lookup.mockRestore();
      gateway.mockRestore();
    }
  });
});
