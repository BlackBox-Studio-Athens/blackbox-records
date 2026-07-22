export const SERVICES_INQUIRY_SERVICE_OPTIONS = [
  'General',
  'Tour Booking',
  'Merch Printing',
  'Vinyl Printing',
] as const;

export type ServicesInquiryService = (typeof SERVICES_INQUIRY_SERVICE_OPTIONS)[number];

export const SERVICES_INQUIRY_RECIPIENT_ALIAS_BY_SERVICE = {
  General: 'info@blackboxrecordsathens.com',
  'Tour Booking': 'booking@blackboxrecordsathens.com',
  'Merch Printing': 'merch@blackboxrecordsathens.com',
  'Vinyl Printing': 'vinyl@blackboxrecordsathens.com',
} as const satisfies Record<ServicesInquiryService, string>;

const SERVICES_INQUIRY_DETAIL_LABEL_BY_SERVICE = {
  General: 'Useful context',
  'Tour Booking': 'Date / City / Venue',
  'Merch Printing': 'Item / Quantity / Deadline',
  'Vinyl Printing': 'Format / Quantity / Target Date',
} as const satisfies Record<ServicesInquiryService, string>;

const CRLF = '\r\n';

export type ServicesInquiryValues = {
  bandOrProject: string;
  email: string;
  message: string;
  name: string;
  service: ServicesInquiryService;
  serviceDetails: string;
};

export type ServicesInquiryDraft = {
  body: string;
  copyText: string;
  mailtoHref: string;
  recipientEmail: string;
  subject: string;
  summary: string;
};

export type ServicesInquiryCopyStatus = 'copied' | 'manual';

function withFallback(value: string, fallback = 'Not provided') {
  const trimmedValue = value.trim();
  return trimmedValue || fallback;
}

export function buildServicesInquiryDraft({
  bandOrProject,
  email,
  message,
  name,
  service,
  serviceDetails,
}: ServicesInquiryValues): ServicesInquiryDraft {
  const normalizedBandOrProject = bandOrProject.trim();
  const normalizedServiceDetails = serviceDetails.trim();
  const recipientEmail = SERVICES_INQUIRY_RECIPIENT_ALIAS_BY_SERVICE[service];
  const subject = ['Services Inquiry', service, normalizedBandOrProject || withFallback(name, 'BlackBox Contact')].join(
    ' — ',
  );
  const body = [
    `Service: ${service}`,
    `Name: ${withFallback(name)}`,
    `Email: ${withFallback(email)}`,
    ...(normalizedBandOrProject ? [`Band / Project: ${normalizedBandOrProject}`] : []),
    ...(normalizedServiceDetails
      ? [`${SERVICES_INQUIRY_DETAIL_LABEL_BY_SERVICE[service]}: ${normalizedServiceDetails}`]
      : []),
    '',
    'Message:',
    withFallback(message, 'No message provided.'),
  ].join(CRLF);
  const summary = [`Subject: ${subject}`, '', body].join(CRLF);
  const copyText = [`Recipient: ${recipientEmail}`, summary].join(CRLF);

  return {
    body,
    copyText,
    mailtoHref: `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    recipientEmail,
    subject,
    summary,
  };
}

export function buildServicesInquiryMailto(values: ServicesInquiryValues) {
  return buildServicesInquiryDraft(values).mailtoHref;
}

export async function copyServicesInquiryText(
  clipboard: Pick<Clipboard, 'writeText'> | undefined,
  text: string,
): Promise<ServicesInquiryCopyStatus> {
  if (!clipboard) return 'manual';

  try {
    await clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'manual';
  }
}
