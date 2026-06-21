import { createProviderSafeTag } from './idempotency';
import {
  buildPaidOrderOpsEmail,
  buildPaidOrderShopperEmail,
  type ShopperNotificationStatus,
} from './paid-order-templates';
import { routeTransactionalEmailRecipient } from './routing';
import { sendTransactionalEmail } from './transactional-email';
import type { EmailProviderGateway } from './spi';
import type {
  EmailOperationResult,
  EmailRuntimeConfig,
  PaidOrderEmailInput,
  PaidOrderEmailNotificationResult,
} from './types';

export type EmailOutcomeLogger = Pick<Console, 'info' | 'warn'>;

const PAID_ORDER_SHOPPER_PURPOSE = 'paid-order-shopper';
const PAID_ORDER_OPS_PURPOSE = 'paid-order-ops';

export async function sendPaidOrderEmailNotifications(input: {
  config: EmailRuntimeConfig;
  logger?: EmailOutcomeLogger;
  order: PaidOrderEmailInput;
  provider: EmailProviderGateway;
}): Promise<PaidOrderEmailNotificationResult> {
  const logger = input.logger ?? console;
  const shopper = await sendShopperEmail(input);
  logPaidOrderEmailOutcome(logger, input.order, PAID_ORDER_SHOPPER_PURPOSE, shopper);

  const ops = await sendTransactionalEmail(input.provider, input.config, {
    content: buildPaidOrderOpsEmail({
      brand: {
        homeUrl: input.config.emailBrandHomeUrl,
        logoUrl: input.config.emailBrandLogoUrl,
      },
      order: input.order,
      recipient: routeTransactionalEmailRecipient(input.config, input.config.opsToEmail),
      shopperNotification: toShopperNotificationStatus(shopper),
    }),
    idempotencyEntityId: input.order.checkoutSessionId,
    purpose: PAID_ORDER_OPS_PURPOSE,
    tags: createPaidOrderTags(input.order, 'ops'),
    to: input.config.opsToEmail,
  });
  logPaidOrderEmailOutcome(logger, input.order, PAID_ORDER_OPS_PURPOSE, ops);

  return {
    ops,
    shopper,
  };
}

async function sendShopperEmail(input: {
  config: EmailRuntimeConfig;
  order: PaidOrderEmailInput;
  provider: EmailProviderGateway;
}): Promise<EmailOperationResult> {
  return sendTransactionalEmail(input.provider, input.config, {
    content: buildPaidOrderShopperEmail({
      brand: {
        homeUrl: input.config.emailBrandHomeUrl,
        logoUrl: input.config.emailBrandLogoUrl,
      },
      order: input.order,
      recipient: routeTransactionalEmailRecipient(input.config, input.order.shopperContact.email),
      replyToEmail: input.config.replyToEmail,
    }),
    idempotencyEntityId: input.order.checkoutSessionId,
    purpose: PAID_ORDER_SHOPPER_PURPOSE,
    tags: createPaidOrderTags(input.order, 'shopper'),
    to: input.order.shopperContact.email,
  });
}

function createPaidOrderTags(order: PaidOrderEmailInput, audience: 'ops' | 'shopper') {
  return [
    createProviderSafeTag({ name: 'category', value: 'paid-order' }),
    createProviderSafeTag({ name: 'audience', value: audience }),
    createProviderSafeTag({ name: 'order_reference', value: order.orderReference }),
  ];
}

function toShopperNotificationStatus(result: EmailOperationResult): ShopperNotificationStatus {
  if (result.status === 'sent') {
    return {
      status: 'sent',
    };
  }

  return {
    reason: result.providerSafeReason ?? 'unknown',
    status: 'failed',
  };
}

function logPaidOrderEmailOutcome(
  logger: EmailOutcomeLogger,
  order: PaidOrderEmailInput,
  purpose: string,
  result: EmailOperationResult,
): void {
  const outcome = {
    event: 'paid_order_email_outcome',
    idempotencyKey: result.idempotencyKey,
    orderReference: order.orderReference,
    purpose,
    safeReason: result.status === 'failed' ? (result.providerSafeReason ?? 'unknown') : undefined,
    status: result.status,
  };

  if (result.status === 'sent') {
    logger.info(outcome);
  } else {
    logger.warn(outcome);
  }
}
