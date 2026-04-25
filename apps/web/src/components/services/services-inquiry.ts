export const SERVICES_INQUIRY_SERVICE_OPTIONS = [
  'General',
  'Tour Booking',
  'Merch Printing',
  'Vinyl Printing',
] as const;

export type ServicesInquiryService = (typeof SERVICES_INQUIRY_SERVICE_OPTIONS)[number];

export type ServicesInquiryValues = {
  bandOrProject: string;
  email: string;
  message: string;
  name: string;
  recipientEmail: string;
  service: ServicesInquiryService;
};

function withFallback(value: string, fallback = 'Not provided') {
  const trimmedValue = value.trim();
  return trimmedValue || fallback;
}

export function buildServicesInquiryMailto({
  bandOrProject,
  email,
  message,
  name,
  recipientEmail,
  service,
}: ServicesInquiryValues) {
  const normalizedBandOrProject = bandOrProject.trim();
  const subject = ['Services Inquiry', service, normalizedBandOrProject || withFallback(name, 'BlackBox Contact')].join(
    ' — ',
  );
  const body = [
    `Name: ${withFallback(name)}`,
    `Email: ${withFallback(email)}`,
    `Band / Project: ${withFallback(normalizedBandOrProject)}`,
    `Service: ${service}`,
    '',
    'Message:',
    withFallback(message, 'No message provided.'),
  ].join('\n');

  return `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

type OpenMailtoInNewTabOptions = {
  mailtoHref: string;
  navigateToHref: (href: string) => void;
  openWindow: (href: string, target: string, features: string) => Window | null;
};

export function openServicesInquiryMailtoInNewTab({
  mailtoHref,
  navigateToHref,
  openWindow,
}: OpenMailtoInNewTabOptions) {
  const popupWindow = openWindow(mailtoHref, '_blank', 'noopener,noreferrer');

  if (!popupWindow) {
    navigateToHref(mailtoHref);
  }
}
