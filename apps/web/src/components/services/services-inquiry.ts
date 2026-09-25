export const SERVICES_INQUIRY_SERVICE_OPTIONS = [
  'General',
  'Tour Booking',
  'Merch Printing',
  'Vinyl Pressing',
] as const;

export type ServicesInquiryService = (typeof SERVICES_INQUIRY_SERVICE_OPTIONS)[number];
