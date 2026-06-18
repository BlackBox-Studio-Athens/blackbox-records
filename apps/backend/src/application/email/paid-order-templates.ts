import { createBlackBoxEmailTemplate } from './templates';
import type { EmailMessageContent, PaidOrderEmailInput } from './types';

export type PaidOrderTemplateRecipientContext = {
  intendedRecipient: string;
  isSinkRouted: boolean;
};

export type ShopperNotificationStatus =
  | {
      status: 'sent';
    }
  | {
      reason: string;
      status: 'failed';
    }
  | {
      status: 'skipped';
    };

export function buildPaidOrderShopperEmail(input: {
  order: PaidOrderEmailInput;
  recipient: PaidOrderTemplateRecipientContext;
  replyToEmail: string;
}): EmailMessageContent {
  const subject = `Payment received - ${input.order.orderReference}`;
  const preheader = `We received payment for ${input.order.orderReference}. BlackBox Records will prepare fulfillment.`;
  const lineItems = formatLineItems(input.order);
  const totalPaid = formatTotalPaid(input.order);
  const sinkNotice = input.recipient.isSinkRouted
    ? renderNotice(`UAT sink delivery. Intended shopper recipient: ${input.recipient.intendedRecipient}.`)
    : '';

  return createBlackBoxEmailTemplate({
    bodyHtml: renderEmailFrame({
      eyebrow: 'Order confirmation',
      title: 'Payment received',
      contentHtml: [
        sinkNotice,
        renderKeyValueBlock([
          ['Order reference', input.order.orderReference],
          ['Total paid', totalPaid],
          ['Item', lineItems],
        ]),
        renderParagraph(
          'Your payment has been received. BlackBox Records will prepare the order for manual fulfillment and will contact you if shipping details need confirmation.',
        ),
        renderParagraph(
          `Questions or fulfillment updates can go to <a href="mailto:${escapeHtml(input.replyToEmail)}" style="color:#f5f5f5;">${escapeHtml(input.replyToEmail)}</a>.`,
        ),
        renderMutedParagraph('This confirmation is not a tax invoice or VAT receipt.'),
      ].join(''),
    }),
    bodyText: [
      subject,
      '',
      sinkText(input.recipient),
      `Order reference: ${input.order.orderReference}`,
      `Total paid: ${totalPaid}`,
      `Item: ${lineItems}`,
      '',
      'Your payment has been received. BlackBox Records will prepare the order for manual fulfillment and will contact you if shipping details need confirmation.',
      `Support: ${input.replyToEmail}`,
      '',
      'This confirmation is not a tax invoice or VAT receipt.',
    ]
      .filter(Boolean)
      .join('\n'),
    preheader,
    subject,
  });
}

export function buildPaidOrderOpsEmail(input: {
  order: PaidOrderEmailInput;
  recipient: PaidOrderTemplateRecipientContext;
  shopperNotification: ShopperNotificationStatus;
}): EmailMessageContent {
  const subject = `Fulfill ${input.order.orderReference} - paid checkout`;
  const preheader = `Paid order ${input.order.orderReference} is ready for manual fulfillment.`;
  const warnings = collectOpsWarnings(input.order, input.shopperNotification);
  const sinkNotice = input.recipient.isSinkRouted
    ? renderNotice(`UAT sink delivery. Intended ops recipient: ${input.recipient.intendedRecipient}.`)
    : '';

  return createBlackBoxEmailTemplate({
    bodyHtml: renderEmailFrame({
      eyebrow: 'Ops fulfillment',
      title: 'Paid order ready',
      contentHtml: [
        sinkNotice,
        renderActionList([
          'Confirm stock movement already recorded by the Worker.',
          'Pack the item listed below.',
          'Use the shopper contact and shipping summary to arrange fulfillment.',
          'Keep any manual shipment notes in operator records.',
        ]),
        warnings.length ? renderWarningList(warnings) : '',
        renderKeyValueBlock([
          ['Order reference', input.order.orderReference],
          ['Payment state', 'Paid'],
          ['Total paid', formatTotalPaid(input.order)],
          ['Line item', formatLineItems(input.order)],
          ['Shopper email', input.order.customerEmail ?? 'Unavailable'],
          ['Shopper phone', input.order.customerPhone ?? 'Unavailable'],
          ['Shipping/contact', formatShippingSummary(input.order)],
        ]),
      ].join(''),
    }),
    bodyText: [
      subject,
      '',
      sinkText(input.recipient),
      'Fulfillment actions:',
      '- Confirm stock movement already recorded by the Worker.',
      '- Pack the item listed below.',
      '- Use the shopper contact and shipping summary to arrange fulfillment.',
      '- Keep any manual shipment notes in operator records.',
      '',
      warnings.length ? ['Warnings:', ...warnings.map((warning) => `- ${warning}`), ''].join('\n') : '',
      `Order reference: ${input.order.orderReference}`,
      'Payment state: Paid',
      `Total paid: ${formatTotalPaid(input.order)}`,
      `Line item: ${formatLineItems(input.order)}`,
      `Shopper email: ${input.order.customerEmail ?? 'Unavailable'}`,
      `Shopper phone: ${input.order.customerPhone ?? 'Unavailable'}`,
      `Shipping/contact: ${formatShippingSummary(input.order)}`,
    ]
      .filter(Boolean)
      .join('\n'),
    preheader,
    subject,
  });
}

function renderEmailFrame(input: { contentHtml: string; eyebrow: string; title: string }): string {
  return [
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b0b0b;padding:28px 12px;">',
    '<tr><td align="center">',
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;border:1px solid #2f2f2f;background:#111111;">',
    '<tr><td style="padding:28px 24px 18px 24px;border-bottom:1px solid #2f2f2f;">',
    '<div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#a3a3a3;">BlackBox Records</div>',
    `<div style="margin-top:12px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#d4d4d4;">${escapeHtml(input.eyebrow)}</div>`,
    `<h1 style="margin:10px 0 0 0;font-size:30px;line-height:1.05;font-weight:700;color:#f5f5f5;">${escapeHtml(input.title)}</h1>`,
    '</td></tr>',
    `<tr><td style="padding:24px;">${input.contentHtml}</td></tr>`,
    '<tr><td style="padding:18px 24px;border-top:1px solid #2f2f2f;color:#858585;font-size:12px;line-height:1.5;">BlackBox Records · Athens</td></tr>',
    '</table>',
    '</td></tr>',
    '</table>',
  ].join('');
}

function renderKeyValueBlock(rows: Array<[string, string]>): string {
  return [
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 20px 0;">',
    ...rows.map(
      ([label, value]) =>
        `<tr><th align="left" style="width:38%;padding:10px 0;border-bottom:1px solid #2a2a2a;color:#a3a3a3;font-size:12px;line-height:1.45;text-transform:uppercase;letter-spacing:0.08em;">${escapeHtml(label)}</th><td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#f5f5f5;font-size:14px;line-height:1.5;">${escapeHtml(value)}</td></tr>`,
    ),
    '</table>',
  ].join('');
}

function renderActionList(actions: string[]): string {
  return [
    '<ol style="margin:0 0 20px 18px;padding:0;color:#f5f5f5;font-size:14px;line-height:1.6;">',
    ...actions.map((action) => `<li style="margin:0 0 8px 0;">${escapeHtml(action)}</li>`),
    '</ol>',
  ].join('');
}

function renderWarningList(warnings: string[]): string {
  return [
    '<div style="margin:0 0 20px 0;padding:14px 16px;border:1px solid #7f1d1d;background:#1f1111;color:#fecaca;">',
    '<div style="font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#fca5a5;">Warnings</div>',
    '<ul style="margin:10px 0 0 18px;padding:0;font-size:14px;line-height:1.55;">',
    ...warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`),
    '</ul></div>',
  ].join('');
}

function renderNotice(message: string): string {
  return `<div style="margin:0 0 20px 0;padding:12px 14px;border:1px solid #525252;background:#191919;color:#d4d4d4;font-size:13px;line-height:1.5;">${escapeHtml(message)}</div>`;
}

function renderParagraph(message: string): string {
  return `<p style="margin:0 0 16px 0;color:#f5f5f5;font-size:14px;line-height:1.65;">${message}</p>`;
}

function renderMutedParagraph(message: string): string {
  return `<p style="margin:0;color:#a3a3a3;font-size:12px;line-height:1.6;">${escapeHtml(message)}</p>`;
}

function formatLineItems(order: PaidOrderEmailInput): string {
  return order.lineItems
    .map((lineItem) => `${lineItem.quantity} x ${humanizeSlug(lineItem.storeItemSlug)} (${lineItem.variantId})`)
    .join('; ');
}

function formatTotalPaid(order: PaidOrderEmailInput): string {
  if (order.amountTotalMinor === null || !order.currencyCode) {
    return 'Paid amount recorded by checkout provider';
  }

  return new Intl.NumberFormat('en-US', {
    currency: order.currencyCode,
    style: 'currency',
  }).format(order.amountTotalMinor / 100);
}

function formatShippingSummary(order: PaidOrderEmailInput): string {
  const address = order.shippingAddress;
  const addressParts = address
    ? [address.line1, address.line2, address.city, address.state, address.postalCode, address.country].filter(Boolean)
    : [];
  const contactParts = [order.customerName, order.customerEmail, order.customerPhone].filter(Boolean);
  const summaryParts = [...contactParts, ...addressParts];

  return summaryParts.length ? summaryParts.join(', ') : 'Unavailable';
}

function collectOpsWarnings(order: PaidOrderEmailInput, shopperNotification: ShopperNotificationStatus): string[] {
  const warnings: string[] = [];

  if (!order.customerEmail) {
    warnings.push('Shopper email was unavailable; shopper confirmation was skipped.');
  } else if (shopperNotification.status === 'failed') {
    warnings.push(`Shopper confirmation was not sent: ${shopperNotification.reason}.`);
  } else if (shopperNotification.status === 'skipped') {
    warnings.push('Shopper confirmation was skipped.');
  }

  if (!order.shippingAddress) {
    warnings.push('Shipping address was unavailable in the checkout session.');
  }

  if (!order.customerPhone) {
    warnings.push('Shopper phone was unavailable in the checkout session.');
  }

  return warnings;
}

function sinkText(recipient: PaidOrderTemplateRecipientContext): string {
  return recipient.isSinkRouted ? `UAT sink delivery. Intended recipient: ${recipient.intendedRecipient}.\n` : '';
}

function humanizeSlug(value: string): string {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
