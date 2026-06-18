import {
  buildPaidOrderOpsEmail,
  buildPaidOrderShopperEmail,
  type ShopperNotificationStatus,
} from './paid-order-templates';
import type { EmailMessageContent, PaidOrderEmailInput } from './types';

export type PaidOrderEmailPreviewName = 'ops-missing-contact' | 'ops-ready' | 'shopper-long-content';

export type PaidOrderEmailPreview = {
  message: EmailMessageContent;
  name: PaidOrderEmailPreviewName;
  order: PaidOrderEmailInput;
};

export function buildPaidOrderEmailPreviews(): PaidOrderEmailPreview[] {
  const longContentOrder: PaidOrderEmailInput = {
    amountTotalMinor: 2500,
    checkoutSessionId: 'cs_preview_paid_order',
    currencyCode: 'EUR',
    customerEmail: 'preview.buyer@example.com',
    customerName: 'Preview Buyer With A Long Fulfillment Contact Name',
    customerPhone: '+302100000000',
    lineItems: [
      {
        quantity: 1,
        storeItemSlug: 'disintegration-black-vinyl-lp-with-extra-long-preview-title',
        variantId: 'variant_disintegration-black-vinyl-lp_standard_preview_long_identifier',
      },
    ],
    orderReference: 'BBR-PREVIEW-LONG',
    paidAt: new Date('2026-04-25T11:00:00.000Z'),
    shippingAddress: {
      city: 'Athens',
      country: 'GR',
      line1: 'Long Preview Street 125 With Additional Building And Entrance Detail',
      line2: 'Apartment 402, Delivery Note For Manual Fulfillment Preview',
      postalCode: '15234',
      state: 'Attica',
    },
  };
  const missingContactOrder: PaidOrderEmailInput = {
    ...longContentOrder,
    checkoutSessionId: 'cs_preview_missing_contact',
    customerEmail: null,
    customerName: null,
    customerPhone: null,
    orderReference: 'BBR-PREVIEW-MISSING',
    shippingAddress: null,
  };
  const shopperRecipient = {
    intendedRecipient: 'preview.buyer@example.com',
    isSinkRouted: false,
  };
  const opsRecipient = {
    intendedRecipient: 'blackboxrecordsathens@gmail.com',
    isSinkRouted: false,
  };
  const sentShopperNotification: ShopperNotificationStatus = { status: 'sent' };
  const skippedShopperNotification: ShopperNotificationStatus = { status: 'skipped' };

  return [
    {
      message: buildPaidOrderShopperEmail({
        order: longContentOrder,
        recipient: shopperRecipient,
        replyToEmail: 'support@blackboxrecordsathens.com',
      }),
      name: 'shopper-long-content',
      order: longContentOrder,
    },
    {
      message: buildPaidOrderOpsEmail({
        order: longContentOrder,
        recipient: opsRecipient,
        shopperNotification: sentShopperNotification,
      }),
      name: 'ops-ready',
      order: longContentOrder,
    },
    {
      message: buildPaidOrderOpsEmail({
        order: missingContactOrder,
        recipient: opsRecipient,
        shopperNotification: skippedShopperNotification,
      }),
      name: 'ops-missing-contact',
      order: missingContactOrder,
    },
  ];
}
