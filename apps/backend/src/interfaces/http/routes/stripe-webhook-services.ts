import {
  applyNonPaidCheckoutReconciliation,
  applyPaidCheckoutReconciliation,
  finalizePaidCheckoutWithRepositories,
  type CheckoutOrderPaid,
  type ApplyNonPaidCheckoutReconciliationResult,
  type ApplyPaidCheckoutReconciliationResult,
  type PaidCheckoutFinalizationRepository,
} from '../../../application/commerce/orders';
import { CatalogReconciler } from '../../../application/commerce/catalog-sync';
import type { CheckoutReconciliation } from '../../../application/commerce/checkout';
import {
  EmailConfigurationError,
  logNewsletterRegistrationOutcome,
  NEWSLETTER_CONSENT_COPY_VERSION,
  readEmailRuntimeConfig,
  registerNewsletterContact,
  sendPaidOrderEmailNotifications,
  type EmailProviderGateway,
  type EmailRuntimeConfig,
  type PaidOrderEmailInput,
} from '../../../application/email';
import type { StoreItemOptionRecord } from '../../../domain/commerce/repositories/spi';
import type { AppBindings } from '../../../env';
import { createResendEmailGatewayFromConfig } from '../../../infrastructure/resend';
import { createStripeCatalogGateway, createStripeCheckoutGateway } from '../../../infrastructure/stripe';
import {
  createPrismaClient,
  PrismaOrderStateRepository,
  PrismaStockChangeRepository,
  PrismaStockRepository,
  PrismaStoreItemOptionRepository,
  PrismaStoreOfferSnapshotRepository,
  PrismaVariantStripeMappingRepository,
  PrismaStripeCatalogWebhookEventRepository,
} from '../../../infrastructure/persistence/prisma';

export function createStripeWebhookServices(bindings: AppBindings) {
  const prisma = createPrismaClient(bindings);
  const orders = new PrismaOrderStateRepository(prisma);
  const paidCheckoutFinalizer = {
    finalizePaidCheckout: (command) =>
      prisma.$transaction(async (transaction) =>
        finalizePaidCheckoutWithRepositories(
          new PrismaOrderStateRepository(transaction),
          new PrismaStockRepository(transaction),
          new PrismaStockChangeRepository(transaction),
          command,
        ),
      ),
  } satisfies PaidCheckoutFinalizationRepository;
  const storeItems = new PrismaStoreItemOptionRepository(prisma);
  const storeOfferSnapshots = new PrismaStoreOfferSnapshotRepository(prisma);
  const variantStripeMappings = new PrismaVariantStripeMappingRepository(prisma);
  const catalogWebhookEvents = new PrismaStripeCatalogWebhookEventRepository(prisma);
  const checkoutGateway = createStripeCheckoutGateway(bindings);
  const catalogReconciler = new CatalogReconciler({
    environment: bindings.APP_ENV,
    storeItems,
    storeOfferSnapshots,
    stripeCatalog: createStripeCatalogGateway(bindings),
    variantStripeMappings,
  });

  return {
    applyNonPaidCheckoutReconciliation: (
      reconciliation: CheckoutReconciliation,
    ): Promise<ApplyNonPaidCheckoutReconciliationResult> => applyNonPaidCheckoutReconciliation(orders, reconciliation),
    applyPaidCheckoutReconciliation: (
      reconciliation: CheckoutReconciliation,
    ): Promise<ApplyPaidCheckoutReconciliationResult> =>
      checkoutGateway
        .readCheckoutSessionLineItems(reconciliation.source.checkoutSessionId)
        .then((lineItems) =>
          applyPaidCheckoutReconciliation(orders, paidCheckoutFinalizer, reconciliation, new Date(), lineItems),
        ),
    disconnect: async () => prisma.$disconnect(),
    findStoreItemByVariantId: (variantId: string) => storeItems.findByVariantId(variantId),
    publishCheckoutOrderPaid: async (event: CheckoutOrderPaid): Promise<void> => {
      let emailConfig: EmailRuntimeConfig;
      let emailProvider: EmailProviderGateway;

      try {
        emailConfig = readEmailRuntimeConfig(bindings);
        emailProvider = createResendEmailGatewayFromConfig(emailConfig);
      } catch (error) {
        console.warn({
          event: 'paid_order_email_outcome',
          orderReference: event.orderReference,
          purpose: 'paid-order-notifications',
          safeReason: error instanceof EmailConfigurationError ? error.safeReason : 'unknown',
          status: 'failed',
        });
        logCheckoutNewsletterOptInConfigurationFailure(event, error);

        return;
      }

      await safelySendPaidOrderEmailNotifications(event, emailConfig, emailProvider);
      await safelyRegisterCheckoutNewsletterOptIn(event, emailConfig, emailProvider);
    },
    recordCatalogWebhookEvent: catalogWebhookEvents.recordCatalogEvent.bind(catalogWebhookEvents),
    reconcileCatalogVariant: (storeItem: StoreItemOptionRecord) =>
      catalogReconciler.reconcileVariant(storeItem, { apply: true }),
  };
}

async function safelySendPaidOrderEmailNotifications(
  event: CheckoutOrderPaid,
  config: EmailRuntimeConfig,
  provider: EmailProviderGateway,
): Promise<void> {
  try {
    await sendPaidOrderEmailNotifications({
      config,
      order: toPaidOrderEmailInput(event),
      provider,
    });
  } catch (error) {
    console.warn({
      event: 'paid_order_email_outcome',
      orderReference: event.orderReference,
      purpose: 'paid-order-notifications',
      safeReason: error instanceof EmailConfigurationError ? error.safeReason : 'unknown',
      status: 'failed',
    });
  }
}

async function safelyRegisterCheckoutNewsletterOptIn(
  event: CheckoutOrderPaid,
  config: EmailRuntimeConfig,
  provider: EmailProviderGateway,
): Promise<void> {
  if (!event.newsletterOptIn) {
    return;
  }

  if (!event.customerEmail) {
    console.warn({
      event: 'newsletter_registration_outcome',
      orderReference: event.orderReference,
      retryable: false,
      safeReason: 'missing_shopper_email',
      source: 'checkout-opt-in',
      status: 'skipped',
    });

    return;
  }

  try {
    const result = await registerNewsletterContact(provider, config, {
      consentCopyVersion: NEWSLETTER_CONSENT_COPY_VERSION,
      consentSource: 'checkout-opt-in',
      consentedAt: event.paidAt ?? event.occurredAt,
      email: event.customerEmail,
      properties: {
        checkoutSessionId: event.checkoutSessionId,
        orderReference: event.orderReference,
      },
    });

    logNewsletterRegistrationOutcome(console, result, {
      source: 'checkout-opt-in',
    });
  } catch (error) {
    console.warn({
      event: 'newsletter_registration_outcome',
      orderReference: event.orderReference,
      retryable: false,
      safeReason: error instanceof EmailConfigurationError ? error.safeReason : 'unknown',
      source: 'checkout-opt-in',
      status: 'failed',
    });
  }
}

function logCheckoutNewsletterOptInConfigurationFailure(event: CheckoutOrderPaid, error: unknown): void {
  if (!event.newsletterOptIn) {
    return;
  }

  console.warn({
    event: 'newsletter_registration_outcome',
    orderReference: event.orderReference,
    retryable: false,
    safeReason: error instanceof EmailConfigurationError ? error.safeReason : 'unknown',
    source: 'checkout-opt-in',
    status: 'failed',
  });
}

function toPaidOrderEmailInput(event: CheckoutOrderPaid): PaidOrderEmailInput {
  return {
    amountTotalMinor: event.amountTotalMinor,
    checkoutSessionId: event.checkoutSessionId,
    currencyCode: event.currencyCode,
    customerEmail: event.customerEmail,
    customerName: event.customerName,
    customerPhone: event.customerPhone,
    lineItems: event.lineItems.map((lineItem) => ({
      quantity: lineItem.quantity,
      storeItemSlug: lineItem.storeItemSlug,
      variantId: lineItem.variantId,
    })),
    orderReference: event.orderReference,
    paidAt: event.paidAt,
    shippingAddress: event.shippingAddress,
  };
}
