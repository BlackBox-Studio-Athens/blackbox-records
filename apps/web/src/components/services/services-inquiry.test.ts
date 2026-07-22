import { describe, expect, it, vi } from 'vitest';

import {
  buildServicesInquiryDraft,
  buildServicesInquiryMailto,
  copyServicesInquiryText,
  SERVICES_INQUIRY_RECIPIENT_ALIAS_BY_SERVICE,
} from './services-inquiry';

describe('services inquiry mailto', () => {
  it('maps every selected service to its fixed public alias', () => {
    expect(SERVICES_INQUIRY_RECIPIENT_ALIAS_BY_SERVICE).toEqual({
      General: 'info@blackboxrecordsathens.com',
      'Tour Booking': 'booking@blackboxrecordsathens.com',
      'Merch Printing': 'merch@blackboxrecordsathens.com',
      'Vinyl Printing': 'vinyl@blackboxrecordsathens.com',
    });
  });

  it('encodes the selected alias, subject, and exact CRLF body', () => {
    const mailto = buildServicesInquiryMailto({
      bandOrProject: 'Mass Culture',
      email: 'mass@example.com',
      message: 'We need vinyl help.',
      name: 'Alex',
      service: 'Vinyl Printing',
      serviceDetails: '12 inch / 300 / November',
    });
    const subject = 'Services Inquiry — Vinyl Printing — Mass Culture';
    const body = [
      'Service: Vinyl Printing',
      'Name: Alex',
      'Email: mass@example.com',
      'Band / Project: Mass Culture',
      'Format / Quantity / Target Date: 12 inch / 300 / November',
      '',
      'Message:',
      'We need vinyl help.',
    ].join('\r\n');

    expect(mailto).toBe(
      `mailto:vinyl@blackboxrecordsathens.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    );
    expect(new URL(mailto).searchParams.get('body')).toBe(body);
    expect(body.replaceAll('\r\n', '')).not.toContain('\n');
  });

  it('builds readable visible and copyable fallback text', () => {
    const draft = buildServicesInquiryDraft({
      bandOrProject: '',
      email: '',
      message: '',
      name: '',
      service: 'General',
      serviceDetails: '',
    });

    expect(draft.recipientEmail).toBe('info@blackboxrecordsathens.com');
    expect(draft.summary).toBe(
      [
        'Subject: Services Inquiry — General — BlackBox Contact',
        '',
        'Service: General',
        'Name: Not provided',
        'Email: Not provided',
        '',
        'Message:',
        'No message provided.',
      ].join('\r\n'),
    );
    expect(draft.copyText).toBe(`Recipient: info@blackboxrecordsathens.com\r\n${draft.summary}`);
  });

  it('copies the complete fallback text when Clipboard API succeeds', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    await expect(copyServicesInquiryText({ writeText }, 'Inquiry details')).resolves.toBe('copied');

    expect(writeText).toHaveBeenCalledWith('Inquiry details');
  });

  it('returns manual-copy state when Clipboard API is unavailable or rejects', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('Clipboard denied'));

    await expect(copyServicesInquiryText(undefined, 'Inquiry details')).resolves.toBe('manual');
    await expect(copyServicesInquiryText({ writeText }, 'Inquiry details')).resolves.toBe('manual');
  });
});
