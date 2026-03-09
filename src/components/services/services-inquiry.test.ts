import { describe, expect, it } from 'vitest';

import { buildServicesInquiryMailto } from './services-inquiry';

describe('services inquiry mailto', () => {
  it('encodes a complete subject and body', () => {
    const mailto = buildServicesInquiryMailto({
      bandOrProject: 'Mass Culture',
      email: 'mass@example.com',
      message: 'We need vinyl help.',
      name: 'Alex',
      recipientEmail: 'blackboxrecordsathens@gmail.com',
      service: 'Vinyl Printing',
    });

    expect(mailto).toContain('mailto:blackboxrecordsathens@gmail.com?subject=');
    expect(decodeURIComponent(mailto)).toContain('Services Inquiry — Vinyl Printing — Mass Culture');
    expect(decodeURIComponent(mailto)).toContain('Name: Alex');
    expect(decodeURIComponent(mailto)).toContain('Email: mass@example.com');
    expect(decodeURIComponent(mailto)).toContain('Band / Project: Mass Culture');
    expect(decodeURIComponent(mailto)).toContain('Message:\nWe need vinyl help.');
  });

  it('fills empty fields with stable fallbacks', () => {
    const mailto = buildServicesInquiryMailto({
      bandOrProject: '',
      email: '',
      message: '',
      name: '',
      recipientEmail: 'blackboxrecordsathens@gmail.com',
      service: 'General',
    });

    expect(decodeURIComponent(mailto)).toContain('Services Inquiry — General — BlackBox Contact');
    expect(decodeURIComponent(mailto)).toContain('Name: Not provided');
    expect(decodeURIComponent(mailto)).toContain('Email: Not provided');
    expect(decodeURIComponent(mailto)).toContain('Band / Project: Not provided');
    expect(decodeURIComponent(mailto)).toContain('No message provided.');
  });
});
