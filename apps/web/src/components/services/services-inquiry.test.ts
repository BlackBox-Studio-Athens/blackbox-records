import { describe, expect, it, vi } from 'vitest';

import { buildServicesInquiryMailto, openServicesInquiryMailtoInNewTab } from './services-inquiry';

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

  it('opens the inquiry in a new tab when possible', () => {
    const openWindow = vi.fn(() => ({} as Window));
    const navigateToHref = vi.fn();

    openServicesInquiryMailtoInNewTab({
      mailtoHref: 'mailto:blackboxrecordsathens@gmail.com?subject=Test',
      navigateToHref,
      openWindow,
    });

    expect(openWindow).toHaveBeenCalledWith(
      'mailto:blackboxrecordsathens@gmail.com?subject=Test',
      '_blank',
      'noopener,noreferrer',
    );
    expect(navigateToHref).not.toHaveBeenCalled();
  });

  it('falls back to same-tab navigation when the new tab is blocked', () => {
    const openWindow = vi.fn(() => null);
    const navigateToHref = vi.fn();

    openServicesInquiryMailtoInNewTab({
      mailtoHref: 'mailto:blackboxrecordsathens@gmail.com?subject=Fallback',
      navigateToHref,
      openWindow,
    });

    expect(navigateToHref).toHaveBeenCalledWith('mailto:blackboxrecordsathens@gmail.com?subject=Fallback');
  });
});
