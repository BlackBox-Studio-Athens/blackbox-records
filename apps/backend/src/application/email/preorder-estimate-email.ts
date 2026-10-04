import {
  renderShopperFacts,
  renderShopperEmailFrame,
  renderShopperParagraph,
  renderShopperReply,
  shopperBrandFontStylesheetUrl,
  type PaidOrderEmailBrand,
} from './paid-order-templates';
import { shipEstimateText } from './ship-estimate-format';
import { createBlackBoxEmailTemplate } from './templates';
import { sendTransactionalEmail } from './transactional-email';
import type { EmailProviderGateway } from './spi';
import type { EmailMessageContent, EmailOperationResult, EmailRuntimeConfig, EmailShipEstimate } from './types';

export type PreorderEstimateEmailInput = {
  orderReference: string;
  itemName: string;
  whenOrdered: EmailShipEstimate | null;
  shipEstimate: EmailShipEstimate | null;
};

export function buildPreorderEstimateEmail(
  input: PreorderEstimateEmailInput & {
    brand: PaidOrderEmailBrand;
    replyToEmail: string;
  },
): EmailMessageContent {
  const subject = `New ship estimate for your pre-order · ${input.orderReference}`;
  const rows: Array<[string, string]> = [
    ['Order reference', input.orderReference],
    ['Was (at order)', shipEstimateText(input.whenOrdered)],
    ['Now expected', shipEstimateText(input.shipEstimate)],
  ];
  const copy = input.shipEstimate
    ? `${input.itemName} is now expected to ship ${shipEstimateText(input.shipEstimate)}, with your whole order in one parcel.`
    : `The ship estimate for ${input.itemName} is now to be confirmed. Your whole order still ships in one parcel when it arrives. We email you when there is a new estimate.`;
  const nextSteps = 'There is nothing you need to do. If you have a question, reply to this email.';
  return createBlackBoxEmailTemplate({
    brandFontStylesheetUrl: shopperBrandFontStylesheetUrl(input.brand),
    subject,
    preheader: `New ship estimate for ${input.orderReference}.`,
    bodyHtml: renderShopperEmailFrame({
      brand: input.brand,
      sectionLabel: 'Pre-order update',
      title: 'Ship date moved',
      contentHtml: [
        renderShopperFacts(rows),
        renderShopperParagraph(copy),
        renderShopperParagraph(nextSteps),
        renderShopperReply(input.replyToEmail),
      ].join(''),
    }),
    bodyText: [
      'BlackBox Records',
      subject,
      'Pre-order update',
      'Ship date moved',
      ...rows.map(([label, value]) => `${label}: ${value}`),
      copy,
      nextSteps,
      `Support: ${input.replyToEmail}`,
    ].join('\n'),
  });
}

export function sendPreorderEstimateEmail(
  input: PreorderEstimateEmailInput & {
    config: EmailRuntimeConfig;
    provider: EmailProviderGateway;
    shopperEmail: string;
    idempotencyEntityId: string;
  },
): Promise<EmailOperationResult> {
  return sendTransactionalEmail(input.provider, input.config, {
    content: buildPreorderEstimateEmail({
      ...input,
      brand: { homeUrl: input.config.emailBrandHomeUrl, logoUrl: input.config.emailBrandLogoUrl },
      replyToEmail: input.config.replyToEmail,
    }),
    idempotencyEntityId: input.idempotencyEntityId,
    purpose: 'preorder-estimate-changed',
    to: input.shopperEmail,
    tags: [{ name: 'order_reference', value: input.orderReference }],
  });
}
