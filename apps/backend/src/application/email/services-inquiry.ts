import { z } from 'zod';

import { createProviderSafeTag } from './idempotency';
import { sendTransactionalEmail } from './transactional-email';
import { createBlackBoxEmailTemplate } from './templates';
import type { EmailProviderGateway } from './spi';
import type { EmailMessageContent, EmailOperationResult, EmailRuntimeConfig, EmailTag } from './types';

export const SERVICES_INQUIRY_SERVICES = ['General', 'Tour Booking', 'Merch Printing', 'Vinyl Printing'] as const;

export type ServicesInquiryService = (typeof SERVICES_INQUIRY_SERVICES)[number];

export const SERVICES_INQUIRY_RECIPIENT_ALIAS_BY_SERVICE = {
  General: 'info@blackboxrecordsathens.com',
  'Tour Booking': 'booking@blackboxrecordsathens.com',
  'Merch Printing': 'merch@blackboxrecordsathens.com',
  'Vinyl Printing': 'vinyl@blackboxrecordsathens.com',
} as const satisfies Record<ServicesInquiryService, string>;

export const SERVICES_INQUIRY_FIELD_LIMITS = {
  bandOrProject: 160,
  email: 254,
  message: 2_000,
  name: 100,
  serviceDetails: 300,
} as const;

export const SERVICES_INQUIRY_EMAIL_PURPOSE = 'services-inquiry';

const servicesInquiryProviderTagByService = {
  General: 'general',
  'Tour Booking': 'tour-booking',
  'Merch Printing': 'merch-printing',
  'Vinyl Printing': 'vinyl-printing',
} as const satisfies Record<ServicesInquiryService, string>;

const servicesInquiryDetailLabelByService = {
  General: 'Useful context',
  'Tour Booking': 'Date / City / Venue',
  'Merch Printing': 'Item / Quantity / Deadline',
  'Vinyl Printing': 'Format / Quantity / Target Date',
} as const satisfies Record<ServicesInquiryService, string>;

const optionalBoundedText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .transform((value) => value || undefined);

const servicesInquiryInputSchema = z
  .object({
    bandOrProject: optionalBoundedText(SERVICES_INQUIRY_FIELD_LIMITS.bandOrProject),
    email: z.string().trim().max(SERVICES_INQUIRY_FIELD_LIMITS.email).email(),
    message: z.string().trim().min(1).max(SERVICES_INQUIRY_FIELD_LIMITS.message),
    name: z.string().trim().min(1).max(SERVICES_INQUIRY_FIELD_LIMITS.name),
    service: z.enum(SERVICES_INQUIRY_SERVICES),
    serviceDetails: optionalBoundedText(SERVICES_INQUIRY_FIELD_LIMITS.serviceDetails),
  })
  .strict();

export type ServicesInquiryInput = z.infer<typeof servicesInquiryInputSchema>;

export type ServicesInquiryOutcomeLogger = Pick<Console, 'info' | 'warn'>;

export function validateServicesInquiryInput(input: unknown): ServicesInquiryInput {
  return servicesInquiryInputSchema.parse(input);
}

export function buildServicesInquiryEmail(input: ServicesInquiryInput): EmailMessageContent {
  const subjectTarget = input.bandOrProject ?? input.name;
  const subject = `Services Inquiry — ${input.service} — ${subjectTarget}`;
  const fields: Array<[string, string]> = [
    ['Service', input.service],
    ['Name', input.name],
    ['Email', input.email],
  ];
  if (input.bandOrProject) fields.push(['Band / Project', input.bandOrProject]);
  if (input.serviceDetails) fields.push([servicesInquiryDetailLabelByService[input.service], input.serviceDetails]);

  return createBlackBoxEmailTemplate({
    bodyHtml: [
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0d0d0d;padding:32px 12px;">',
      '<tr><td align="center">',
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:620px;border:1px solid #454545;border-collapse:collapse;background:#151515;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;">',
      '<tr><td class="email-pad" style="padding:26px 24px 20px;border-bottom:1px solid #454545;">',
      '<div style="color:#f5f5f5;font-size:16px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">BlackBox Records</div>',
      '<div style="margin:20px 0 0;color:#a3a3a3;font-size:11px;line-height:1;letter-spacing:0.18em;text-transform:uppercase;">Services</div>',
      '<h1 style="margin:10px 0 0;color:#f5f5f5;font-size:30px;line-height:1.02;font-weight:800;">New services inquiry</h1>',
      '</td></tr>',
      '<tr><td class="email-pad" style="padding:24px;">',
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-top:1px solid #333;">',
      ...fields.map(
        ([label, value]) =>
          `<tr><th align="left" class="email-stack" style="width:34%;padding:12px 10px 12px 0;border-bottom:1px solid #333;color:#a3a3a3;font-size:11px;line-height:1.45;text-transform:uppercase;letter-spacing:0.1em;vertical-align:top;">${escapeHtml(label)}</th><td class="email-stack" style="padding:12px 0;border-bottom:1px solid #333;color:#f5f5f5;font-size:14px;line-height:1.55;vertical-align:top;word-break:break-word;white-space:pre-wrap;">${escapeHtml(value)}</td></tr>`,
      ),
      '</table>',
      '<div style="margin-top:24px;color:#a3a3a3;font-size:11px;line-height:1;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;">Message</div>',
      `<div style="margin-top:10px;color:#f5f5f5;font-size:15px;line-height:1.65;white-space:pre-wrap;word-break:break-word;">${escapeHtml(input.message)}</div>`,
      '<p style="margin:24px 0 0;color:#a3a3a3;font-size:12px;line-height:1.55;">Reply to this email to contact the visitor.</p>',
      '</td></tr>',
      '<tr><td class="email-pad" style="padding:18px 24px;border-top:1px solid #333;color:#a3a3a3;font-size:12px;line-height:1.55;">BlackBox Records, Athens</td></tr>',
      '</table>',
      '</td></tr>',
      '</table>',
    ].join(''),
    bodyText: [
      'BlackBox Records',
      subject,
      '',
      ...fields.map(([label, value]) => `${label}: ${value}`),
      '',
      'Message:',
      input.message,
      '',
      'Reply to this email to contact the visitor.',
    ].join('\n'),
    preheader: `New ${input.service} services inquiry from ${subjectTarget}.`,
    subject,
  });
}

export function createServicesInquiryEmailTags(service: ServicesInquiryService): EmailTag[] {
  return [
    createProviderSafeTag({ name: 'category', value: SERVICES_INQUIRY_EMAIL_PURPOSE }),
    createProviderSafeTag({ name: 'service', value: servicesInquiryProviderTagByService[service] }),
  ];
}

export async function sendServicesInquiry(input: {
  config: EmailRuntimeConfig;
  inquiry: unknown;
  logger?: ServicesInquiryOutcomeLogger;
  provider: EmailProviderGateway;
}): Promise<EmailOperationResult> {
  const inquiry = validateServicesInquiryInput(input.inquiry);
  const result = await sendTransactionalEmail(input.provider, input.config, {
    content: buildServicesInquiryEmail(inquiry),
    idempotencyEntityId: crypto.randomUUID(),
    purpose: SERVICES_INQUIRY_EMAIL_PURPOSE,
    replyTo: inquiry.email,
    tags: createServicesInquiryEmailTags(inquiry.service),
    to: SERVICES_INQUIRY_RECIPIENT_ALIAS_BY_SERVICE[inquiry.service],
  });
  const outcome = {
    event: 'services_inquiry_email_outcome',
    idempotencyKey: result.idempotencyKey,
    retryable: result.retryable,
    safeReason: result.status === 'failed' ? (result.providerSafeReason ?? 'unknown') : undefined,
    service: servicesInquiryProviderTagByService[inquiry.service],
    sinkRouted: result.routedRecipient?.isSinkRouted ?? false,
    status: result.status,
  };
  const logger = input.logger ?? console;

  if (result.status === 'sent') {
    logger.info(outcome);
  } else {
    logger.warn(outcome);
  }

  return result;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
