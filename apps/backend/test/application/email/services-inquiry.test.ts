import { describe, expect, it } from 'vitest';

import {
  buildServicesInquiryEmail,
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

describe('services inquiry email template', () => {
  it('uses the approved subject and field order', () => {
    const content = buildServicesInquiryEmail({
      ...validInquiry,
      bandOrProject: 'Night Shift',
      service: 'Tour Booking',
      serviceDetails: 'October / Athens / Temple',
    });

    expect(content.subject).toBe('Services Inquiry — Tour Booking — Night Shift');
    expectInOrder(content.html, [
      '>Service</th>',
      '>Tour Booking</td>',
      '>Name</th>',
      '>Visitor Name</td>',
      '>Email</th>',
      '>visitor@example.com</td>',
      '>Band / Project</th>',
      '>Night Shift</td>',
      '>Date / City / Venue</th>',
      '>October / Athens / Temple</td>',
      '>Message</div>',
      '>We need help with an upcoming release.</div>',
    ]);
    expectInOrder(content.text, [
      'Service: Tour Booking',
      'Name: Visitor Name',
      'Email: visitor@example.com',
      'Band / Project: Night Shift',
      'Date / City / Venue: October / Athens / Temple',
      'Message:\nWe need help with an upcoming release.',
    ]);
  });

  it('escapes every visitor value in HTML and shows the email once', () => {
    const content = buildServicesInquiryEmail({
      bandOrProject: '"Band" & Friends',
      email: 'visitor+tag@example.com',
      message: '<script>alert("message")</script> & goodbye',
      name: '<Visitor & Co>',
      service: 'Merch Printing',
      serviceDetails: '100 < shirts & "fast"',
    });

    expect(content.html).toContain('&lt;Visitor &amp; Co&gt;');
    expect(content.html).toContain('&quot;Band&quot; &amp; Friends');
    expect(content.html).toContain('100 &lt; shirts &amp; &quot;fast&quot;');
    expect(content.html).toContain('&lt;script&gt;alert(&quot;message&quot;)&lt;/script&gt; &amp; goodbye');
    expect(content.html).not.toContain('<script>alert("message")</script>');
    expect(content.html.match(/visitor\+tag@example\.com/g)).toHaveLength(1);
  });

  it('omits optional fields and falls back to the visitor name in the subject', () => {
    const content = buildServicesInquiryEmail(validateServicesInquiryInput(validInquiry));

    expect(content.subject).toBe('Services Inquiry — General — Visitor Name');
    expect(content.html).not.toContain('Band / Project');
    expect(content.html).not.toContain('Useful context');
    expect(content.text).not.toContain('Band / Project');
    expect(content.text).not.toContain('Useful context');
  });

  it('keeps HTML and plain text operationally equivalent', () => {
    const input = {
      ...validInquiry,
      bandOrProject: 'Night Shift',
      service: 'Vinyl Printing' as const,
      serviceDetails: '12 inch / 300 / November',
    };
    const content = buildServicesInquiryEmail(input);
    const fields = [
      ['Service', input.service],
      ['Name', input.name],
      ['Email', input.email],
      ['Band / Project', input.bandOrProject],
      ['Format / Quantity / Target Date', input.serviceDetails],
    ];

    for (const [label, value] of fields) {
      expect(content.html).toContain(`>${label}</th>`);
      expect(content.html).toContain(`>${value}</td>`);
      expect(content.text).toContain(`${label}: ${value}`);
    }
    expect(content.html).toContain(`>${input.message}</div>`);
    expect(content.text).toContain(`Message:\n${input.message}`);
    expect(content.html).toContain('Reply to this email to contact the visitor.');
    expect(content.text).toContain('Reply to this email to contact the visitor.');
  });
});

function expectInOrder(value: string, expectedParts: string[]): void {
  let previousIndex = -1;

  for (const part of expectedParts) {
    const index = value.indexOf(part, previousIndex + 1);
    expect(index, `Expected ${JSON.stringify(part)} after index ${previousIndex}`).toBeGreaterThan(previousIndex);
    previousIndex = index;
  }
}
