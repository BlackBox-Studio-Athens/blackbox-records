import { z } from 'zod';

import { createProviderSafeTag } from './idempotency';
import type { EmailTag } from './types';

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

export function validateServicesInquiryInput(input: unknown): ServicesInquiryInput {
  return servicesInquiryInputSchema.parse(input);
}

export function createServicesInquiryEmailTags(service: ServicesInquiryService): EmailTag[] {
  return [
    createProviderSafeTag({ name: 'category', value: SERVICES_INQUIRY_EMAIL_PURPOSE }),
    createProviderSafeTag({ name: 'service', value: servicesInquiryProviderTagByService[service] }),
  ];
}
