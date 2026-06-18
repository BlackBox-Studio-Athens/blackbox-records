import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  parseCheckoutSessionId,
  parsePaymentIntentId,
  type CheckoutReconciliation,
} from '../../src/application/commerce/checkout';
import type * as orderApplication from '../../src/application/commerce/orders';
import type { FinalizePaidCheckoutCommand } from '../../src/application/commerce/orders';
import type { AppBindings } from '../../src/env';
import { createStripeWebhookServices } from '../../src/interfaces/http/routes/stripe-webhook-services';

const serviceMocks = vi.hoisted(() => {
  const transactionPrisma = {
    marker: 'transaction-prisma',
  };
  const rootPrisma = {
    $disconnect: vi.fn(async () => undefined),
    $transaction: vi.fn(async <T>(callback: (transaction: typeof transactionPrisma) => Promise<T>) =>
      callback(transactionPrisma),
    ),
    marker: 'root-prisma',
  };
  const checkoutGateway = {
    readCheckoutSessionLineItems: vi.fn(async () => [
      {
        quantity: 1,
        stripePriceId: 'price_test_123',
      },
    ]),
  };
  const catalogReconciler = {
    reconcileVariant: vi.fn(),
  };
  const applyPaidCheckoutReconciliation = vi.fn(
    async (
      _orders: unknown,
      paidCheckoutFinalizer: {
        finalizePaidCheckout: (command: FinalizePaidCheckoutCommand) => Promise<unknown>;
      },
    ) => {
      await paidCheckoutFinalizer.finalizePaidCheckout({
        checkoutSessionId: parseCheckoutSessionId('cs_test_123'),
        lineItems: [],
        stripePaymentIntentId: parsePaymentIntentId('pi_test_123'),
        transitionedAt: new Date('2026-04-25T11:00:00.000Z'),
      });

      return {
        kind: 'replay' as const,
        order: {
          checkoutSessionId: 'cs_test_123',
        },
      };
    },
  );

  return {
    applyPaidCheckoutReconciliation,
    catalogReconciler,
    checkoutGateway,
    createPrismaClient: vi.fn(() => rootPrisma),
    createStripeCatalogGateway: vi.fn(() => ({})),
    createStripeCheckoutGateway: vi.fn(() => checkoutGateway),
    finalizePaidCheckoutWithRepositories: vi.fn(async () => ({
      kind: 'replay' as const,
      order: {
        checkoutSessionId: 'cs_test_123',
      },
    })),
    PrismaOrderStateRepository: vi.fn(function PrismaOrderStateRepository(client: unknown) {
      return {
        client,
        repository: 'orders',
      };
    }),
    PrismaStockChangeRepository: vi.fn(function PrismaStockChangeRepository(client: unknown) {
      return {
        client,
        repository: 'stockChanges',
      };
    }),
    PrismaStockRepository: vi.fn(function PrismaStockRepository(client: unknown) {
      return {
        client,
        repository: 'stock',
      };
    }),
    PrismaStoreItemOptionRepository: vi.fn(function PrismaStoreItemOptionRepository(client: unknown) {
      return {
        client,
        findByVariantId: vi.fn(),
        repository: 'storeItems',
      };
    }),
    PrismaStoreOfferSnapshotRepository: vi.fn(function PrismaStoreOfferSnapshotRepository(client: unknown) {
      return {
        client,
        repository: 'storeOfferSnapshots',
      };
    }),
    PrismaStripeCatalogWebhookEventRepository: vi.fn(function PrismaStripeCatalogWebhookEventRepository(
      client: unknown,
    ) {
      return {
        client,
        recordCatalogEvent: vi.fn(),
        repository: 'catalogWebhookEvents',
      };
    }),
    PrismaVariantStripeMappingRepository: vi.fn(function PrismaVariantStripeMappingRepository(client: unknown) {
      return {
        client,
        repository: 'variantStripeMappings',
      };
    }),
    rootPrisma,
    transactionPrisma,
  };
});

vi.mock('../../src/application/commerce/catalog-sync', () => ({
  CatalogReconciler: vi.fn(function CatalogReconciler() {
    return serviceMocks.catalogReconciler;
  }),
}));

vi.mock('../../src/application/commerce/orders', async (importOriginal) => {
  const actual = await importOriginal<typeof orderApplication>();

  return {
    ...actual,
    applyPaidCheckoutReconciliation: serviceMocks.applyPaidCheckoutReconciliation,
    finalizePaidCheckoutWithRepositories: serviceMocks.finalizePaidCheckoutWithRepositories,
  };
});

vi.mock('../../src/infrastructure/persistence/prisma', () => ({
  createPrismaClient: serviceMocks.createPrismaClient,
  PrismaOrderStateRepository: serviceMocks.PrismaOrderStateRepository,
  PrismaStockChangeRepository: serviceMocks.PrismaStockChangeRepository,
  PrismaStockRepository: serviceMocks.PrismaStockRepository,
  PrismaStoreItemOptionRepository: serviceMocks.PrismaStoreItemOptionRepository,
  PrismaStoreOfferSnapshotRepository: serviceMocks.PrismaStoreOfferSnapshotRepository,
  PrismaStripeCatalogWebhookEventRepository: serviceMocks.PrismaStripeCatalogWebhookEventRepository,
  PrismaVariantStripeMappingRepository: serviceMocks.PrismaVariantStripeMappingRepository,
}));

vi.mock('../../src/infrastructure/stripe', () => ({
  createStripeCatalogGateway: serviceMocks.createStripeCatalogGateway,
  createStripeCheckoutGateway: serviceMocks.createStripeCheckoutGateway,
}));

const bindings = {
  APP_ENV: 'local',
  COMMERCE_DB: {} as D1Database,
  STRIPE_PAYMENT_METHOD_CONFIGURATION_ID: 'pmc_test_blackbox_checkout',
  STRIPE_SECRET_KEY: 'sk_test_123',
  STRIPE_WEBHOOK_SECRET: 'whsec_test_123',
} satisfies AppBindings;

describe('createStripeWebhookServices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs paid checkout finalization inside the Prisma transaction boundary', async () => {
    const services = createStripeWebhookServices(bindings);

    await expect(services.applyPaidCheckoutReconciliation(createPaidReconciliation())).resolves.toEqual({
      kind: 'replay',
      order: {
        checkoutSessionId: 'cs_test_123',
      },
    });

    expect(serviceMocks.createPrismaClient).toHaveBeenCalledWith(bindings);
    expect(serviceMocks.rootPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(serviceMocks.PrismaOrderStateRepository).toHaveBeenCalledWith(serviceMocks.rootPrisma);
    expect(serviceMocks.PrismaOrderStateRepository).toHaveBeenCalledWith(serviceMocks.transactionPrisma);
    expect(serviceMocks.PrismaStockRepository).toHaveBeenCalledWith(serviceMocks.transactionPrisma);
    expect(serviceMocks.PrismaStockChangeRepository).toHaveBeenCalledWith(serviceMocks.transactionPrisma);
    expect(serviceMocks.finalizePaidCheckoutWithRepositories).toHaveBeenCalledWith(
      expect.objectContaining({
        client: serviceMocks.transactionPrisma,
        repository: 'orders',
      }),
      expect.objectContaining({
        client: serviceMocks.transactionPrisma,
        repository: 'stock',
      }),
      expect.objectContaining({
        client: serviceMocks.transactionPrisma,
        repository: 'stockChanges',
      }),
      expect.objectContaining({
        checkoutSessionId: 'cs_test_123',
      }),
    );
  });
});

function createPaidReconciliation(): CheckoutReconciliation {
  const checkoutSessionId = parseCheckoutSessionId('cs_test_123');

  return {
    checkoutState: {
      checkoutSessionId,
      paymentStatus: 'paid',
      shippingLocker: null,
      state: 'paid',
      status: 'complete',
    },
    isAuthoritative: false,
    recommendedOrderStatus: 'paid',
    source: {
      amountTotalMinor: 2500,
      checkoutSessionId,
      currencyCode: 'EUR',
      customer: {
        email: 'buyer@example.com',
        name: 'Buyer Name',
        phone: '+302100000000',
      },
      newsletterOptIn: false,
      shippingAddress: null,
      stripePaymentIntentId: parsePaymentIntentId('pi_test_123'),
    },
  };
}
