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

type EmailOutcomeLogger = Pick<Console, 'info' | 'warn'>;

type PaidOrderEmailSendInput = {
  config: EmailRuntimeConfig;
  logger?: EmailOutcomeLogger;
  order: PaidOrderEmailInput;
  provider: EmailProviderGateway;
};

const PAID_ORDER_SHOPPER_PURPOSE = 'paid-order-shopper';
const PAID_ORDER_OPS_PURPOSE = 'paid-order-ops';

export async function sendPaidOrderEmailNotifications(
  input: PaidOrderEmailSendInput,
): Promise<PaidOrderEmailNotificationResult> {
  const shopper = await sendPaidOrderShopperEmail(input);
  const ops = await sendPaidOrderOpsEmail({
    ...input,
    shopperNotification: toShopperNotificationStatus(shopper),
  });

  return {
    ops,
    shopper,
  };
}

export async function sendPaidOrderOpsEmail(
  input: PaidOrderEmailSendInput & { shopperNotification?: ShopperNotificationStatus },
): Promise<EmailOperationResult> {
  const result = await sendTransactionalEmail(input.provider, input.config, {
    content: buildPaidOrderOpsEmail({
      brand: {
        homeUrl: input.config.emailBrandHomeUrl,
        logoUrl: input.config.emailBrandLogoUrl,
      },
      order: input.order,
      recipient: routeTransactionalEmailRecipient(input.config, input.config.opsToEmail),
      shopperNotification: input.shopperNotification,
    }),
    idempotencyEntityId: input.order.checkoutSessionId,
    purpose: PAID_ORDER_OPS_PURPOSE,
    tags: createPaidOrderTags(input.order, 'ops'),
    to: input.config.opsToEmail,
  });
  logPaidOrderEmailOutcome(input.logger ?? console, input.order, PAID_ORDER_OPS_PURPOSE, result);

  return result;
}

export async function sendPaidOrderShopperEmail(input: PaidOrderEmailSendInput): Promise<EmailOperationResult> {
  const result = await sendTransactionalEmail(input.provider, input.config, {
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
  logPaidOrderEmailOutcome(input.logger ?? console, input.order, PAID_ORDER_SHOPPER_PURPOSE, result);

  return result;
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
