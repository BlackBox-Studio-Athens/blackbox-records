import {
  buildPaidOrderOpsEmail,
  buildPaidOrderShopperEmail,
  type ShopperNotificationStatus,
} from './paid-order-templates';
import type { EmailMessageContent, PaidOrderEmailInput } from './types';

export type PaidOrderEmailPreviewName = 'ops-ready' | 'shopper-long-content';

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
        productImage: {
          altText: 'Disintegration Black Vinyl Lp With Extra Long Preview Title product image',
          url: 'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/releases/afterwise-album-cover-distro-mockup.webp',
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
    homeUrl: 'https://blackbox-studio-athens.github.io/blackbox-records/',
    logoUrl: 'https://blackbox-studio-athens.github.io/blackbox-records/assets/images/brand/logo-horizontal.png',
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
  ];
}
