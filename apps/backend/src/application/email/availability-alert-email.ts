import {
  renderShopperButtonLink,
  renderShopperEmailFrame,
  renderShopperFacts,
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

export const AVAILABILITY_ALERT_EMAIL_PURPOSE = 'availability_alert';

export type AvailabilityAlertEmailInput = {
  title: string;
  artist: string | null;
  format: string | null;
  storeItemSlug: string;
  /** Present when the variant opened as a pre-order; the estimate is null when shoppers see none. */
  preorder: { shipEstimate: EmailShipEstimate | null } | null;
};

const deletionNotice = 'You asked for one email when this could be ordered. We have now deleted your address.';

/** The Store item page, resolved against the environment's public site home. */
export function availabilityAlertItemUrl(homeUrl: string, storeItemSlug: string): string {
  return new URL(`store/${encodeURIComponent(storeItemSlug)}/`, homeUrl).href;
}

export function buildAvailabilityAlertEmail(
  input: AvailabilityAlertEmailInput & { brand: PaidOrderEmailBrand; replyToEmail: string },
): EmailMessageContent {
  const preorder = input.preorder !== null;
  const estimate = input.preorder?.shipEstimate ?? null;
  const subject = preorder ? `${input.title} is on pre-order` : `${input.title} is available`;
  const heading = preorder ? 'Now on pre-order' : 'Now available';
  const named = input.artist ? `${input.title} by ${input.artist}` : input.title;
  const copy = preorder
    ? `${named} can now be pre-ordered.${estimate ? ` Expected to ship ${shipEstimateText(estimate)}.` : ''}`
    : `${named} can now be bought on the BlackBox Records Store.`;
  const rows: Array<[string, string]> = [
    ['Item', input.title],
    ...(input.artist ? [['Artist', input.artist] as [string, string]] : []),
    ...(input.format ? [['Format', input.format] as [string, string]] : []),
    ...(estimate ? [['Expected to ship', shipEstimateText(estimate)] as [string, string]] : []),
  ];
  const itemUrl = availabilityAlertItemUrl(input.brand.homeUrl, input.storeItemSlug);
  const linkLabel = `View ${input.title}`;
  return createBlackBoxEmailTemplate({
    brandFontStylesheetUrl: shopperBrandFontStylesheetUrl(input.brand),
    subject,
    preheader: copy,
    bodyHtml: renderShopperEmailFrame({
      brand: input.brand,
      sectionLabel: 'Notify me',
      title: heading,
      contentHtml: [
        renderShopperFacts(rows),
        renderShopperParagraph(copy),
        `<p style="margin:0 0 16px;">${renderShopperButtonLink(itemUrl, linkLabel)}</p>`,
        renderShopperParagraph(deletionNotice),
        renderShopperReply(input.replyToEmail),
      ].join(''),
    }),
    bodyText: [
      'BlackBox Records',
      subject,
      'Notify me',
      heading,
      ...rows.map(([label, value]) => `${label}: ${value}`),
      copy,
      `${linkLabel}: ${itemUrl}`,
      deletionNotice,
      `Support: ${input.replyToEmail}`,
    ].join('\n'),
  });
}

export function sendAvailabilityAlertEmail(
  input: AvailabilityAlertEmailInput & {
    config: EmailRuntimeConfig;
    provider: EmailProviderGateway;
    shopperEmail: string;
    idempotencyEntityId: string;
  },
): Promise<EmailOperationResult> {
  return sendTransactionalEmail(input.provider, input.config, {
    content: buildAvailabilityAlertEmail({
      ...input,
      brand: { homeUrl: input.config.emailBrandHomeUrl, logoUrl: input.config.emailBrandLogoUrl },
      replyToEmail: input.config.replyToEmail,
    }),
    idempotencyEntityId: input.idempotencyEntityId,
    purpose: AVAILABILITY_ALERT_EMAIL_PURPOSE,
    to: input.shopperEmail,
  });
}
