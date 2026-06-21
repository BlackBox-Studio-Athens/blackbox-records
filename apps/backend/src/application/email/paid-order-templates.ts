import { createBlackBoxEmailTemplate } from './templates';
import type { EmailMessageContent, PaidOrderEmailInput } from './types';

export type PaidOrderEmailBrand = {
  homeUrl: string;
  logoUrl: string;
};

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
    };

const emailDesignTokens = {
  accent: '#922f3f',
  accentMuted: '#cf6b80',
  border: '#262626',
  borderStrong: '#2b2b2b',
  fontStack: 'Helvetica Neue, Helvetica, Arial, sans-serif',
  metadata: '#b3b3b3',
  panel: '#0f0f0f',
  panelRaised: '#141414',
  shell: '#0d0d0d',
  text: '#f5f5f5',
  textSubtle: '#d8d8d8',
  warningBackground: '#211113',
  warningBorder: '#922f3f',
  warningText: '#ffd7de',
} as const;
const shopperPaymentThankYouCopy =
  'Thank you for your order. We have received your payment and will prepare everything for manual fulfillment. If we need anything else for shipping, we will contact you directly.';
const paymentDocumentCopy = 'This email confirms that payment was received. It is not a tax invoice or VAT receipt.';

export function buildPaidOrderShopperEmail(input: {
  brand: PaidOrderEmailBrand;
  order: PaidOrderEmailInput;
  recipient: PaidOrderTemplateRecipientContext;
  replyToEmail: string;
}): EmailMessageContent {
  const subject = `Payment received - ${input.order.orderReference}`;
  const preheader = `Payment received for ${input.order.orderReference}. BlackBox Records will prepare fulfillment.`;
  const shopperLineItems = formatShopperLineItems(input.order);
  const totalPaid = formatTotalPaid(input.order);

  return createBlackBoxEmailTemplate({
    bodyHtml: renderEmailFrame({
      brand: input.brand,
      contentHtml: [
        renderReferenceBlock('Order reference', input.order.orderReference),
        renderLineItemSummary(input.order, { includeVariant: false }),
        renderDetailTable([['Total paid', totalPaid]]),
        renderParagraph(shopperPaymentThankYouCopy),
        renderSupportCta(input.replyToEmail),
        renderPaymentDocumentNote(),
      ].join(''),
      sectionLabel: 'Order confirmation',
      title: 'Payment received',
    }),
    bodyText: [
      'BlackBox Records',
      subject,
      '',
      `Order reference: ${input.order.orderReference}`,
      `Item: ${shopperLineItems}`,
      `Total paid: ${totalPaid}`,
      '',
      shopperPaymentThankYouCopy,
      `Support: ${input.replyToEmail}`,
      '',
      paymentDocumentCopy,
    ]
      .filter(Boolean)
      .join('\n'),
    preheader,
    subject,
  });
}

export function buildPaidOrderOpsEmail(input: {
  brand: PaidOrderEmailBrand;
  order: PaidOrderEmailInput;
  recipient: PaidOrderTemplateRecipientContext;
  shopperNotification: ShopperNotificationStatus;
}): EmailMessageContent {
  const subject = `Fulfill ${input.order.orderReference} - paid checkout`;
  const preheader = `Paid order ${input.order.orderReference} is ready for manual fulfillment.`;
  const warnings = collectOpsWarnings(input.shopperNotification);

  return createBlackBoxEmailTemplate({
    bodyHtml: renderEmailFrame({
      brand: input.brand,
      contentHtml: [
        renderActionList([
          'Confirm stock movement already recorded by the Worker.',
          'Pack the paid item.',
          'Use the shopper contact and shipping address to arrange fulfillment.',
          'Keep manual shipment notes in operator records.',
        ]),
        warnings.length ? renderWarningList(warnings) : '',
        renderLineItemSummary(input.order, { includeVariant: true }),
        renderDetailSection('Order', [
          ['Reference', [input.order.orderReference]],
          ['Payment state', ['Paid']],
          ['Total paid', [formatTotalPaid(input.order)]],
        ]),
        renderDetailSection('Shopper', [
          ['Name', [input.order.customerName ?? 'Not provided']],
          ['Email', [input.order.shopperContact.email]],
          ['Phone', [input.order.shopperContact.phone]],
        ]),
        renderDetailSection('Shipping address', formatShippingAddressRows(input.order.shippingAddress)),
      ].join(''),
      sectionLabel: 'Order to ship',
      title: 'Paid order ready',
    }),
    bodyText: [
      'BlackBox Records',
      subject,
      '',
      'Fulfillment actions:',
      '- Confirm stock movement already recorded by the Worker.',
      '- Pack the paid item.',
      '- Use the shopper contact and shipping address to arrange fulfillment.',
      '- Keep manual shipment notes in operator records.',
      '',
      warnings.length ? ['Warnings:', ...warnings.map((warning) => `- ${warning}`), ''].join('\n') : '',
      `Order reference: ${input.order.orderReference}`,
      'Payment state: Paid',
      `Total paid: ${formatTotalPaid(input.order)}`,
      `Item / variant / quantity: ${formatOpsLineItems(input.order)}`,
      '',
      'Shopper:',
      `Name: ${input.order.customerName ?? 'Not provided'}`,
      `Email: ${input.order.shopperContact.email}`,
      `Phone: ${input.order.shopperContact.phone}`,
      '',
      'Shipping address:',
      ...formatShippingAddressTextLines(input.order.shippingAddress),
    ]
      .filter(Boolean)
      .join('\n'),
    preheader,
    subject,
  });
}

function renderEmailFrame(input: {
  brand: PaidOrderEmailBrand;
  contentHtml: string;
  sectionLabel: string;
  title: string;
}): string {
  return [
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${emailDesignTokens.shell};padding:32px 12px;">`,
    '<tr><td align="center">',
    `<table class="email-panel" role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:620px;border:1px solid ${emailDesignTokens.borderStrong};border-collapse:collapse;background:${emailDesignTokens.panel};font-family:${emailDesignTokens.fontStack};">`,
    `<tr><td class="email-pad" style="padding:26px 24px 20px 24px;border-bottom:1px solid ${emailDesignTokens.borderStrong};">`,
    renderBrandLockup(input.brand),
    `<div style="margin:20px 0 0 0;color:${emailDesignTokens.metadata};font-size:11px;line-height:1;letter-spacing:0.18em;text-transform:uppercase;">${escapeHtml(input.sectionLabel)}</div>`,
    `<h1 style="margin:10px 0 0 0;color:${emailDesignTokens.text};font-size:30px;line-height:1.02;font-weight:800;letter-spacing:0;">${escapeHtml(input.title)}</h1>`,
    '</td></tr>',
    `<tr><td class="email-pad" style="padding:24px;">${input.contentHtml}</td></tr>`,
    `<tr><td class="email-pad" style="padding:18px 24px;border-top:1px solid ${emailDesignTokens.border};color:${emailDesignTokens.metadata};font-size:12px;line-height:1.55;">BlackBox Records, Athens</td></tr>`,
    '</table>',
    '</td></tr>',
    '</table>',
  ].join('');
}

function renderBrandLockup(brand: PaidOrderEmailBrand): string {
  return [
    `<a href="${escapeHtml(brand.homeUrl)}" style="display:block;color:${emailDesignTokens.text};text-decoration:none;">`,
    `<img class="email-logo" src="${escapeHtml(brand.logoUrl)}" width="180" height="44" alt="BlackBox Records" style="display:block;width:180px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;background:${emailDesignTokens.panel};color:${emailDesignTokens.text};font-size:18px;line-height:44px;font-weight:800;">`,
    '</a>',
  ].join('');
}

function renderReferenceBlock(label: string, value: string): string {
  return [
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 18px 0;border:1px solid ${emailDesignTokens.borderStrong};border-top:3px solid ${emailDesignTokens.accent};background:${emailDesignTokens.panelRaised};">`,
    '<tr>',
    `<td style="padding:14px 16px;color:${emailDesignTokens.metadata};font-size:11px;line-height:1.35;letter-spacing:0.14em;text-transform:uppercase;">${escapeHtml(label)}</td>`,
    '</tr>',
    '<tr>',
    `<td style="padding:0 16px 16px 16px;color:${emailDesignTokens.text};font-size:22px;line-height:1.15;font-weight:800;word-break:break-word;">${escapeHtml(value)}</td>`,
    '</tr>',
    '</table>',
  ].join('');
}

function renderDetailTable(rows: Array<[string, string]>): string {
  return renderDetailSection(
    null,
    rows.map(([label, value]) => [label, [value]]),
  );
}

function renderDetailSection(title: string | null, rows: Array<[string, string[]]>): string {
  const labelCellStyle = [
    'width:34%',
    'padding:12px 10px 12px 0',
    `border-bottom:1px solid ${emailDesignTokens.border}`,
    `color:${emailDesignTokens.metadata}`,
    'font-size:11px',
    'line-height:1.45',
    'text-transform:uppercase',
    'letter-spacing:0.1em',
    'font-weight:700',
    'vertical-align:top',
  ].join(';');
  const valueCellStyle = [
    'padding:12px 0',
    `border-bottom:1px solid ${emailDesignTokens.border}`,
    `color:${emailDesignTokens.text}`,
    'font-size:14px',
    'line-height:1.55',
    'vertical-align:top',
    'word-break:break-word',
  ].join(';');

  return [
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 20px 0;border-top:1px solid ${emailDesignTokens.border};">`,
    title
      ? `<tr><td colspan="2" style="padding:12px 0 4px 0;color:${emailDesignTokens.metadata};font-size:11px;line-height:1;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;">${escapeHtml(title)}</td></tr>`
      : '',
    ...rows.map(
      ([label, values]) =>
        `<tr><th align="left" class="email-stack" style="${labelCellStyle}">${escapeHtml(label)}</th><td class="email-stack" style="${valueCellStyle}">${renderStackedValues(values)}</td></tr>`,
    ),
    '</table>',
  ].join('');
}

function renderStackedValues(values: string[]): string {
  return values
    .filter(Boolean)
    .map((value) => `<div>${escapeHtml(value)}</div>`)
    .join('');
}

function renderLineItemSummary(order: PaidOrderEmailInput, options: { includeVariant: boolean }): string {
  return [
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 20px 0;border:1px solid ${emailDesignTokens.borderStrong};background:${emailDesignTokens.panelRaised};">`,
    `<tr><td colspan="2" style="padding:14px 16px 10px 16px;color:${emailDesignTokens.metadata};font-size:11px;line-height:1;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;">Items</td></tr>`,
    ...order.lineItems.map((lineItem) => renderLineItemRow(lineItem, options)),
    '</table>',
  ].join('');
}

function renderLineItemRow(
  lineItem: PaidOrderEmailInput['lineItems'][number],
  options: { includeVariant: boolean },
): string {
  const itemName = humanizeSlug(lineItem.storeItemSlug);
  const itemMeta = options.includeVariant
    ? `Quantity: ${lineItem.quantity} | Variant: ${lineItem.variantId}`
    : `Quantity: ${lineItem.quantity}`;
  const productImageStyle = [
    'display:block',
    'width:72px',
    'height:72px',
    `border:1px solid ${emailDesignTokens.borderStrong}`,
    'outline:none',
    'text-decoration:none',
    `background:${emailDesignTokens.shell}`,
    `color:${emailDesignTokens.text}`,
    'font-size:10px',
    'line-height:12px',
  ].join(';');
  const imageCell = lineItem.productImage
    ? [
        `<td width="88" style="width:88px;padding:0 12px 16px 16px;vertical-align:top;">`,
        `<img src="${escapeHtml(lineItem.productImage.url)}" width="72" height="72" alt="${escapeHtml(lineItem.productImage.altText)}" style="${productImageStyle}">`,
        '</td>',
      ].join('')
    : '';

  return [
    '<tr>',
    imageCell,
    `<td${lineItem.productImage ? '' : ' colspan="2"'} style="padding:0 16px 16px ${lineItem.productImage ? '0' : '16px'};vertical-align:top;color:${emailDesignTokens.text};">`,
    `<div style="font-size:15px;line-height:1.45;font-weight:800;word-break:break-word;">${escapeHtml(itemName)}</div>`,
    `<div style="margin-top:6px;color:${emailDesignTokens.metadata};font-size:12px;line-height:1.45;word-break:break-word;">${escapeHtml(itemMeta)}</div>`,
    '</td>',
    '</tr>',
  ].join('');
}

function renderActionList(actions: string[]): string {
  return [
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 20px 0;border:1px solid ${emailDesignTokens.borderStrong};background:${emailDesignTokens.panelRaised};">`,
    `<tr><td style="padding:14px 16px 4px 16px;color:${emailDesignTokens.metadata};font-size:11px;line-height:1;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;">Fulfillment actions</td></tr>`,
    `<tr><td style="padding:4px 16px 16px 16px;"><ol style="margin:0 0 0 18px;padding:0;color:${emailDesignTokens.text};font-size:14px;line-height:1.6;">`,
    ...actions.map((action) => `<li style="margin:0 0 8px 0;padding-left:2px;">${escapeHtml(action)}</li>`),
    '</ol></td></tr>',
    '</table>',
  ].join('');
}

function renderWarningList(warnings: string[]): string {
  return [
    `<div style="margin:0 0 20px 0;padding:14px 16px;border:1px solid ${emailDesignTokens.warningBorder};background:${emailDesignTokens.warningBackground};color:${emailDesignTokens.warningText};">`,
    `<div style="font-size:11px;text-transform:uppercase;letter-spacing:0.14em;color:${emailDesignTokens.accentMuted};font-weight:700;">Warnings</div>`,
    '<ul style="margin:10px 0 0 18px;padding:0;font-size:14px;line-height:1.55;">',
    ...warnings.map((warning) => `<li style="margin:0 0 6px 0;">${escapeHtml(warning)}</li>`),
    '</ul></div>',
  ].join('');
}

function renderParagraph(message: string): string {
  return `<p style="margin:0 0 16px 0;color:${emailDesignTokens.text};font-size:14px;line-height:1.7;">${escapeHtml(message)}</p>`;
}

function renderPaymentDocumentNote(): string {
  return [
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0;border:1px solid ${emailDesignTokens.border};background:${emailDesignTokens.shell};">`,
    `<tr><td style="padding:12px 14px;color:${emailDesignTokens.textSubtle};font-size:12px;line-height:1.6;">${escapeHtml(paymentDocumentCopy)}</td></tr>`,
    '</table>',
  ].join('');
}

function renderSupportCta(replyToEmail: string): string {
  const escapedEmail = escapeHtml(replyToEmail);
  return `<p style="margin:0 0 16px 0;"><a href="mailto:${escapedEmail}" style="display:inline-block;border:1px solid ${emailDesignTokens.borderStrong};background:${emailDesignTokens.text};color:#090909;font-size:13px;line-height:1.2;font-weight:800;text-decoration:none;padding:11px 14px;">Reply to support</a><span style="display:block;margin-top:8px;color:${emailDesignTokens.metadata};font-size:12px;line-height:1.5;">${escapedEmail}</span></p>`;
}

function formatShopperLineItems(order: PaidOrderEmailInput): string {
  return order.lineItems.map((lineItem) => `${lineItem.quantity} x ${humanizeSlug(lineItem.storeItemSlug)}`).join('; ');
}

function formatOpsLineItems(order: PaidOrderEmailInput): string {
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

function formatShippingAddressRows(address: PaidOrderEmailInput['shippingAddress']): Array<[string, string[]]> {
  return [
    ['Street', [address.line1]],
    ['Details', [address.line2 ?? 'Not provided']],
    ['City', [formatCityLine(address)]],
    ['Country', [address.country]],
  ];
}

function formatShippingAddressTextLines(address: PaidOrderEmailInput['shippingAddress']): string[] {
  return [
    `Street: ${address.line1}`,
    `Details: ${address.line2 ?? 'Not provided'}`,
    `City: ${formatCityLine(address)}`,
    `Country: ${address.country}`,
  ];
}

function formatCityLine(address: PaidOrderEmailInput['shippingAddress']): string {
  return [address.city, address.state, address.postalCode].filter(Boolean).join(', ');
}

function collectOpsWarnings(shopperNotification: ShopperNotificationStatus): string[] {
  const warnings: string[] = [];

  if (shopperNotification.status === 'failed') {
    warnings.push(`Shopper confirmation was not sent: ${shopperNotification.reason}.`);
  }

  return warnings;
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
