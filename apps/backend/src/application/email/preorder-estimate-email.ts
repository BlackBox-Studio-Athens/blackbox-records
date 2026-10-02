import {
  renderDetailTable,
  renderEmailFrame,
  renderParagraph,
  renderSupportCta,
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
    ['Item', input.itemName],
    ['When you ordered', shipEstimateText(input.whenOrdered)],
    ['Now expected', shipEstimateText(input.shipEstimate)],
  ];
  const copy =
    'Nothing else changes: everything is still sent in one parcel when the pre-order arrives. If you have a question, reply to this email.';
  return createBlackBoxEmailTemplate({
    subject,
    preheader: `New ship estimate for ${input.orderReference}.`,
    bodyHtml: renderEmailFrame({
      brand: input.brand,
      sectionLabel: 'Pre-order update',
      title: 'Ship estimate changed',
      contentHtml: [renderDetailTable(rows), renderParagraph(copy), renderSupportCta(input.replyToEmail)].join(''),
    }),
    bodyText: [
      'BlackBox Records',
      subject,
      'Pre-order update',
      'Ship estimate changed',
      ...rows.map(([label, value]) => `${label}: ${value}`),
      copy,
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
