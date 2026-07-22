import { describe, expect, it } from 'vitest';

import {
  createServicesInquiryEmailTags,
  SERVICES_INQUIRY_EMAIL_PURPOSE,
  SERVICES_INQUIRY_FIELD_LIMITS,
  SERVICES_INQUIRY_RECIPIENT_ALIAS_BY_SERVICE,
  validateServicesInquiryInput,
} from '../../../src/application/email';

const validInquiry = {
  email: 'visitor@example.com',
  message: 'We need help with an upcoming release.',
  name: 'Visitor Name',
  service: 'General' as const,
};

describe('services inquiry email application input', () => {
  it('owns the fixed service recipient aliases', () => {
    expect(SERVICES_INQUIRY_RECIPIENT_ALIAS_BY_SERVICE).toEqual({
      General: 'info@blackboxrecordsathens.com',
      'Tour Booking': 'booking@blackboxrecordsathens.com',
      'Merch Printing': 'merch@blackboxrecordsathens.com',
      'Vinyl Printing': 'vinyl@blackboxrecordsathens.com',
    });
  });

  it('trims valid input and removes blank optional values', () => {
    expect(
      validateServicesInquiryInput({
        ...validInquiry,
        bandOrProject: '   ',
        email: '  visitor@example.com  ',
        message: '  We need help with an upcoming release.  ',
        name: '  Visitor Name  ',
        serviceDetails: '  Useful context  ',
      }),
    ).toEqual({
      email: 'visitor@example.com',
      message: 'We need help with an upcoming release.',
      name: 'Visitor Name',
      service: 'General',
      serviceDetails: 'Useful context',
    });
  });

  it('accepts values at every field limit', () => {
    const result = validateServicesInquiryInput({
      bandOrProject: 'b'.repeat(SERVICES_INQUIRY_FIELD_LIMITS.bandOrProject),
      email: `${'e'.repeat(242)}@example.com`,
      message: 'm'.repeat(SERVICES_INQUIRY_FIELD_LIMITS.message),
      name: 'n'.repeat(SERVICES_INQUIRY_FIELD_LIMITS.name),
      service: 'Tour Booking',
      serviceDetails: 'd'.repeat(SERVICES_INQUIRY_FIELD_LIMITS.serviceDetails),
    });

    expect(result.name).toHaveLength(SERVICES_INQUIRY_FIELD_LIMITS.name);
    expect(result.email).toHaveLength(SERVICES_INQUIRY_FIELD_LIMITS.email);
    expect(result.bandOrProject).toHaveLength(SERVICES_INQUIRY_FIELD_LIMITS.bandOrProject);
    expect(result.serviceDetails).toHaveLength(SERVICES_INQUIRY_FIELD_LIMITS.serviceDetails);
    expect(result.message).toHaveLength(SERVICES_INQUIRY_FIELD_LIMITS.message);
  });

  it.each([
    ['name', { ...validInquiry, name: 'n'.repeat(SERVICES_INQUIRY_FIELD_LIMITS.name + 1) }],
    ['email', { ...validInquiry, email: `${'e'.repeat(243)}@example.com` }],
    ['bandOrProject', { ...validInquiry, bandOrProject: 'b'.repeat(SERVICES_INQUIRY_FIELD_LIMITS.bandOrProject + 1) }],
    [
      'serviceDetails',
      { ...validInquiry, serviceDetails: 'd'.repeat(SERVICES_INQUIRY_FIELD_LIMITS.serviceDetails + 1) },
    ],
    ['message', { ...validInquiry, message: 'm'.repeat(SERVICES_INQUIRY_FIELD_LIMITS.message + 1) }],
  ])('rejects %s beyond its field limit', (_field, input) => {
    expect(() => validateServicesInquiryInput(input)).toThrow();
  });

  it.each(['name', 'email', 'message'] as const)('rejects blank required %s', (field) => {
    expect(() => validateServicesInquiryInput({ ...validInquiry, [field]: '   ' })).toThrow();
  });

  it('rejects invalid email, unsupported service, and unknown fields', () => {
    expect(() => validateServicesInquiryInput({ ...validInquiry, email: 'not-an-email' })).toThrow();
    expect(() => validateServicesInquiryInput({ ...validInquiry, service: 'Mastering' })).toThrow();
    expect(() => validateServicesInquiryInput({ ...validInquiry, recipient: 'attacker@example.com' })).toThrow();
  });

  it.each([
    ['General', 'general'],
    ['Tour Booking', 'tour-booking'],
    ['Merch Printing', 'merch-printing'],
    ['Vinyl Printing', 'vinyl-printing'],
  ] as const)('provides safe purpose and tags for %s', (service, serviceTag) => {
    expect(SERVICES_INQUIRY_EMAIL_PURPOSE).toBe('services-inquiry');
    expect(createServicesInquiryEmailTags(service)).toEqual([
      { name: 'category', value: 'services-inquiry' },
      { name: 'service', value: serviceTag },
    ]);
  });
});
