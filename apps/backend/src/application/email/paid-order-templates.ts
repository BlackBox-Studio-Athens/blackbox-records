import { createBlackBoxEmailTemplate } from './templates';
import type { EmailMessageContent, PaidOrderEmailInput } from './types';
import { latestEmailShipEstimate, shipEstimateText } from './ship-estimate-format';

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

export function createPaidOrderShopperSubject(orderReference: string): string {
  return `Payment received · ${orderReference}`;
}

export function createPaidOrderOpsSubject(orderReference: string): string {
  return `Fulfill ${orderReference} - paid checkout`;
}

export function buildPaidOrderShopperEmail(input: {
  brand: PaidOrderEmailBrand;
  order: PaidOrderEmailInput;
  recipient: PaidOrderTemplateRecipientContext;
  replyToEmail: string;
}): EmailMessageContent {
  const subject = createPaidOrderShopperSubject(input.order.orderReference);
  const preheader = `Payment received for ${input.order.orderReference}. BlackBox Records will prepare fulfillment.`;
  const shopperLineItems = formatShopperLineItems(input.order);
  const preorder = orderPreorder(input.order);
  const preorderLines = input.order.lineItems.filter((line) => line.preorder);
  const arrival = preorderLines.length === 1 ? `${preorderLines[0]!.displayName} arrives` : 'the pre-orders arrive';
  const preorderCopy = preorder
    ? `Your order includes a pre-order. Everything is sent in one parcel when ${arrival}${preorder.shipEstimate ? `, expected ${shipEstimateText(preorder.shipEstimate)}` : ''}. We email you if that changes.`
    : '';
  const fulfillmentCopy = preorderCopy || shopperPaymentThankYouCopy;
  const money = shopperMonetaryRows(input.order);

  return createBlackBoxEmailTemplate({
    brandFontStylesheetUrl: shopperBrandFontStylesheetUrl(input.brand),
    bodyHtml: renderShopperEmailFrame({
      brand: input.brand,
      contentHtml: [
        renderShopperFacts([['Order reference', input.order.orderReference]]),
        renderShopperLineItems(input.order),
        renderShopperFacts(money),
        renderShopperParagraph(fulfillmentCopy),
        renderShopperReply(input.replyToEmail),
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
      ...money.map(([label, amount]) => `${label}: ${amount}`),
      '',
      'Thank you for your order. We have received your payment in full.',
      fulfillmentCopy,
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
  shopperNotification?: ShopperNotificationStatus;
}): EmailMessageContent {
  const subject = createPaidOrderOpsSubject(input.order.orderReference);
  const preorder = orderPreorder(input.order);
  const preheader = preorder
    ? `Paid order ${input.order.orderReference} is awaiting stock.`
    : `Paid order ${input.order.orderReference} is ready for manual fulfillment.`;
  const warnings = input.shopperNotification ? collectOpsWarnings(input.shopperNotification) : [];
  const actions = preorder
    ? [
        'Hold this order: it includes a pre-order.',
        `Ship nothing until the pre-order copies arrive${preorder.shipEstimate ? ` (expected ${shipEstimateText(preorder.shipEstimate)})` : ''}.`,
        'Send everything in one parcel.',
        'Find it in Orders under Awaiting stock.',
      ]
    : [
        'Confirm stock movement already recorded by the Worker.',
        'Pack the paid item.',
        'Use the shopper contact and shipping address to arrange fulfillment.',
        'Keep manual shipment notes in operator records.',
      ];

  return createBlackBoxEmailTemplate({
    bodyHtml: renderEmailFrame({
      brand: input.brand,
      contentHtml: [
        renderActionList(actions),
        warnings.length ? renderWarningList(warnings) : '',
        renderLineItemSummary(input.order, { includeVariant: true }),
        monetaryRows(input.order).length ? renderDetailTable(monetaryRows(input.order)) : '',
        renderDetailSection('Order', [
          ['Reference', [input.order.orderReference]],
          ['Payment state', ['Paid']],
          ['Total paid', [formatTotalPaid(input.order)]],
        ]),
        renderDetailSection('Shopper', [
          ['Name', [input.order.customerName ?? 'Not provided']],
          ['Email', [input.order.shopperContact.email]],
          ['Phone', [input.order.shopperContact.phone ?? 'Not provided']],
        ]),
        renderDetailSection('Shipping address', formatShippingAddressRows(input.order.shippingAddress)),
      ].join(''),
      sectionLabel: preorder ? 'Order to hold' : 'Order to ship',
      title: preorder ? 'Paid order · awaiting stock' : 'Paid order ready',
    }),
    bodyText: [
      'BlackBox Records',
      subject,
      '',
      preorder ? 'Order to hold\nPaid order · awaiting stock' : '',
      'Fulfillment actions:',
      ...actions.map((action) => `- ${action}`),
      '',
      warnings.length ? ['Warnings:', ...warnings.map((warning) => `- ${warning}`), ''].join('\n') : '',
      `Order reference: ${input.order.orderReference}`,
      'Payment state: Paid',
      `Total paid: ${formatTotalPaid(input.order)}`,
      ...monetaryRows(input.order).map(([label, amount]) => `${label}: ${amount}`),
      `Item / variant / quantity: ${formatOpsLineItems(input.order)}`,
      '',
      'Shopper:',
      `Name: ${input.order.customerName ?? 'Not provided'}`,
      `Email: ${input.order.shopperContact.email}`,
      `Phone: ${input.order.shopperContact.phone ?? 'Not provided'}`,
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

export function renderEmailFrame(input: {
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

export function shopperBrandFontStylesheetUrl(brand: PaidOrderEmailBrand): string {
  return new URL('../../fonts/brand/veneer.css', brand.logoUrl).href;
}

export function renderShopperEmailFrame(input: {
  brand: PaidOrderEmailBrand;
  contentHtml: string;
  sectionLabel: string;
  title: string;
}): string {
  return [
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:${emailDesignTokens.shell};"><tr><td align="center">`,
    `<table class="shopper-panel" role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:476px;border:1px solid ${emailDesignTokens.borderStrong};border-top:2px solid #2d766a;border-collapse:collapse;background:${emailDesignTokens.panel};color:${emailDesignTokens.text};font-family:Inter,Helvetica Neue,Arial,sans-serif;"><tr><td style="padding:28px;">`,
    `<a href="${escapeHtml(input.brand.homeUrl)}" style="display:block;margin:0 0 16px;text-decoration:none;"><img class="email-logo" src="${escapeHtml(input.brand.logoUrl)}" width="130" alt="BlackBox Records" style="display:block;width:130px;max-width:100%;height:auto;border:0;color:${emailDesignTokens.text};"></a>`,
    `<p class="shopper-eyebrow" style="margin:0 0 16px;color:${emailDesignTokens.metadata};font-size:11.52px;line-height:1.3;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;">${escapeHtml(input.sectionLabel)}</p>`,
    `<h1 style="margin:0 0 16px;color:${emailDesignTokens.text};font-family:Veneer,Bebas Neue,Impact,sans-serif;font-size:25.6px;line-height:0.98;font-weight:900;letter-spacing:0.035em;text-transform:uppercase;">${escapeHtml(input.title)}</h1>`,
    input.contentHtml,
    '</td></tr></table></td></tr></table>',
  ].join('');
}

export function renderShopperFacts(rows: Array<[string, string]>): string {
  return [
    `<table class="shopper-facts" width="100%" cellspacing="0" cellpadding="0" style="width:100%;table-layout:fixed;border-collapse:collapse;margin:0 0 16px;border:1px solid ${emailDesignTokens.borderStrong};background:${emailDesignTokens.panel};">`,
    ...rows.map(([label, value], index) => {
      const border = index ? `border-top:1px solid ${emailDesignTokens.borderStrong};` : '';
      return `<tr><th scope="row" align="left" style="${border}box-sizing:border-box;width:194.4px;padding:11.2px 12px 11.2px 14.4px;vertical-align:baseline;color:${emailDesignTokens.metadata};font-size:10.88px;line-height:1.3;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;">${escapeHtml(label)}</th><td style="${border}padding:11.2px 14.4px 11.2px 0;vertical-align:baseline;color:${emailDesignTokens.text};font-size:14px;line-height:1.45;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(value)}</td></tr>`;
    }),
    '</table>',
  ].join('');
}

export function renderShopperParagraph(message: string): string {
  return `<p class="shopper-copy" style="margin:0 0 16px;color:${emailDesignTokens.text};font-size:14px;line-height:1.6;overflow-wrap:anywhere;">${escapeHtml(message)}</p>`;
}

export function renderShopperReply(replyToEmail: string): string {
  return renderShopperButtonLink(`mailto:${replyToEmail}`, 'Reply to BlackBox Records');
}

/** The outlined shopper email button, for a link to the site or a reply. */
export function renderShopperButtonLink(href: string, label: string): string {
  return `<a class="shopper-reply" href="${escapeHtml(href)}" style="display:inline-block;box-sizing:border-box;max-width:100%;border:1px solid ${emailDesignTokens.border};padding:10px 24px;background:transparent;color:${emailDesignTokens.text};font-size:16px;line-height:22px;font-weight:500;text-decoration:none;text-align:center;">${escapeHtml(label)}</a>`;
}

function shopperLineStatus(line: PaidOrderEmailInput['lineItems'][number], hasPreorder: boolean): string {
  return line.preorder ? preorderLineText(line) : hasPreorder ? 'In stock, sent with the pre-order' : 'In stock';
}

function shopperLineIdentity(line: PaidOrderEmailInput['lineItems'][number]): string {
  return `${line.displayName}${line.optionLabel ? ` · ${line.optionLabel}` : ''} × ${line.quantity}`;
}

function renderShopperLineItems(order: PaidOrderEmailInput): string {
  const hasPreorder = order.lineItems.some((line) => line.preorder);
  return [
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:0 0 16px;">',
    ...order.lineItems.map(
      (line, index) =>
        `<tr><td style="padding:${index ? '12px' : '0'} 0 0;overflow-wrap:anywhere;word-break:break-word;"><p class="shopper-item" style="margin:0;color:${emailDesignTokens.text};font-size:14px;line-height:normal;font-weight:600;">${escapeHtml(shopperLineIdentity(line))}</p><p style="margin:0;color:${line.preorder ? emailDesignTokens.text : emailDesignTokens.metadata};font-size:12px;line-height:1.7;">${escapeHtml(shopperLineStatus(line, hasPreorder))}</p></td></tr>`,
    ),
    '</table>',
  ].join('');
}

function shopperMonetaryRows(order: PaidOrderEmailInput): Array<[string, string]> {
  const amount = (minor: number | null | undefined) =>
    typeof minor === 'number' && order.currencyCode
      ? new Intl.NumberFormat('en-IE', { style: 'currency', currency: order.currencyCode }).format(minor / 100)
      : 'Not recorded';
  return [
    ['Items', amount(order.merchandiseGrossMinor)],
    ['Delivery', amount(order.deliveryGrossMinor)],
    ['Total paid', formatTotalPaid(order)],
  ];
}

export function renderDetailTable(rows: Array<[string, string]>): string {
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
  const itemName = lineItem.displayName;
  const itemMeta = [
    lineItem.optionLabel,
    `Quantity: ${lineItem.quantity}`,
    options.includeVariant ? `Variant: ${lineItem.variantId}` : null,
  ]
    .filter(Boolean)
    .join(' | ');
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
    lineItem.preorder
      ? `<div style="margin-top:6px;color:#4ca999;font-size:12px;line-height:1.45;">${escapeHtml(preorderLineText(lineItem))}</div>`
      : '',
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

function formatShopperLineItems(order: PaidOrderEmailInput): string {
  const hasPreorder = order.lineItems.some((line) => line.preorder);
  return order.lineItems
    .map((line) => `${shopperLineIdentity(line)}\n${shopperLineStatus(line, hasPreorder)}`)
    .join('\n');
}

function formatOpsLineItems(order: PaidOrderEmailInput): string {
  return order.lineItems
    .map(
      (lineItem) =>
        `${lineItem.quantity} x ${lineItem.displayName} (${lineItem.variantId})${lineItem.preorder ? `\n${preorderLineText(lineItem)}` : ''}`,
    )
    .join('; ');
}

function preorderLineText(line: PaidOrderEmailInput['lineItems'][number]): string {
  return line.preorder?.shipEstimate
    ? `Pre-order, expected to ship ${shipEstimateText(line.preorder.shipEstimate)}`
    : 'Pre-order, expected to ship: To be confirmed';
}

function orderPreorder(order: PaidOrderEmailInput) {
  const estimates = order.lineItems.flatMap((line) => (line.preorder ? [line.preorder.shipEstimate] : []));
  return estimates.length ? { shipEstimate: latestEmailShipEstimate(estimates) } : null;
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

function monetaryRows(order: PaidOrderEmailInput): Array<[string, string]> {
  if (
    typeof order.merchandiseGrossMinor !== 'number' ||
    typeof order.deliveryGrossMinor !== 'number' ||
    typeof order.totalVatMinor !== 'number' ||
    !order.acceptedParcelTier
  )
    return [];
  const format = (amount: number) =>
    new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount / 100);
  return [
    ['Merchandise', format(order.merchandiseGrossMinor)],
    [
      order.acceptedParcelTier === 'manual'
        ? 'BOX NOW locker delivery'
        : `BOX NOW ${order.acceptedParcelTier === 'small' ? 'Small' : 'Medium'} locker delivery`,
      format(order.deliveryGrossMinor),
    ],
    [
      order.taxCollectionMode === 'NO_TAX_COLLECTED' ? 'VAT collected at checkout' : 'Including VAT',
      format(order.totalVatMinor),
    ],
  ];
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
