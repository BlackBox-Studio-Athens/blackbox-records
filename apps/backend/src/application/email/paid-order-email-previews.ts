import {
  buildPaidOrderOpsEmail,
  buildPaidOrderShopperEmail,
  type ShopperNotificationStatus,
} from './paid-order-templates';
import type { EmailMessageContent, PaidOrderEmailInput } from './types';
import { buildPreorderEstimateEmail } from './preorder-estimate-email';

export type PaidOrderEmailPreviewName =
  'ops-ready' | 'shopper-long-content' | 'shopper-preorder' | 'ops-preorder' | 'preorder-estimate-changed';

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
    customerName: 'Preview Buyer With A Long Fulfillment Contact Name',
    lineItems: [
      {
        displayName: 'Disintegration Black Vinyl Lp With Extra Long Preview Title',
        optionLabel: null,
        productImage: {
          altText: 'Disintegration Black Vinyl Lp With Extra Long Preview Title product image',
          url: 'https://blackbox-records-web-uat.pages.dev/assets/images/brand/logo-240.webp',
        },
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
    shopperContact: {
      email: 'preview.buyer@example.com',
      phone: '+302100000000',
    },
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
  const previewBrand = {
    homeUrl: 'https://blackbox-records-web-uat.pages.dev/',
    logoUrl: 'https://blackbox-records-web-uat.pages.dev/assets/images/brand/logo-horizontal.png',
  };
  const preorderOrder: PaidOrderEmailInput = {
    ...longContentOrder,
    lineItems: longContentOrder.lineItems.map((line) => ({
      ...line,
      preorder: { shipEstimate: { kind: 'month', month: '2026-10', part: null } },
    })),
  };

  return [
    {
      message: buildPaidOrderShopperEmail({
        brand: previewBrand,
        order: longContentOrder,
        recipient: shopperRecipient,
        replyToEmail: 'support@blackboxrecordsathens.com',
      }),
      name: 'shopper-long-content',
      order: longContentOrder,
    },
    {
      message: buildPaidOrderOpsEmail({
        brand: previewBrand,
        order: longContentOrder,
        recipient: opsRecipient,
        shopperNotification: sentShopperNotification,
      }),
      name: 'ops-ready',
      order: longContentOrder,
    },
    {
      message: buildPaidOrderShopperEmail({
        brand: previewBrand,
        order: preorderOrder,
        recipient: shopperRecipient,
        replyToEmail: 'support@blackboxrecordsathens.com',
      }),
      name: 'shopper-preorder',
      order: preorderOrder,
    },
    {
      message: buildPaidOrderOpsEmail({
        brand: previewBrand,
        order: preorderOrder,
        recipient: opsRecipient,
        shopperNotification: sentShopperNotification,
      }),
      name: 'ops-preorder',
      order: preorderOrder,
    },
    {
      message: buildPreorderEstimateEmail({
        brand: previewBrand,
        orderReference: preorderOrder.orderReference,
        itemName: preorderOrder.lineItems[0]!.displayName,
        whenOrdered: preorderOrder.lineItems[0]!.preorder!.shipEstimate,
        shipEstimate: { kind: 'month', month: '2026-11', part: 'mid' },
        replyToEmail: 'support@blackboxrecordsathens.com',
      }),
      name: 'preorder-estimate-changed',
      order: preorderOrder,
    },
  ];
}
