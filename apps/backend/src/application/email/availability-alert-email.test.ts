import { describe, expect, it } from 'vitest';

import { availabilityAlertItemUrl, buildAvailabilityAlertEmail } from './availability-alert-email';

const brand = {
  homeUrl: 'https://blackbox-records-web.pages.dev/',
  logoUrl: 'https://blackbox-records-web.pages.dev/assets/images/brand/logo-horizontal.png',
};
const base = {
  brand,
  title: 'Anarchotribal',
  artist: 'Ouranopithecus',
  format: 'Vinyl',
  storeItemSlug: 'anarchotribal-vinyl',
  preorder: null,
  replyToEmail: 'support@blackboxrecordsathens.com',
};

describe('availability alert email', () => {
  it('says the item can be bought, links its Store page and confirms the address is deleted', () => {
    const email = buildAvailabilityAlertEmail(base);
    expect(email.subject).toBe('Anarchotribal is available');
    for (const body of [email.html, email.text]) {
      expect(body).toContain('Notify me');
      expect(body).toContain('Now available');
      expect(body).toContain('Anarchotribal by Ouranopithecus can now be bought on the BlackBox Records Store.');
      expect(body).toContain('View Anarchotribal');
      expect(body).toContain('https://blackbox-records-web.pages.dev/store/anarchotribal-vinyl/');
      expect(body).toContain('You asked for one email when this could be ordered. We have now deleted your address.');
      expect(body).not.toMatch(/€|copies left|newsletter/i);
    }
    expect(email.text).toContain('Format: Vinyl');
    expect(email.html).toContain('href="mailto:support@blackboxrecordsathens.com"');
  });

  it('names a pre-order and omits the ship sentence without an estimate', () => {
    const withEstimate = buildAvailabilityAlertEmail({
      ...base,
      preorder: { shipEstimate: { kind: 'month', month: '2026-11', part: 'late' } },
    });
    expect(withEstimate.subject).toBe('Anarchotribal is on pre-order');
    expect(withEstimate.text).toContain('Now on pre-order');
    expect(withEstimate.text).toContain(
      'Anarchotribal by Ouranopithecus can now be pre-ordered. Expected to ship around late November 2026.',
    );
    expect(withEstimate.text).toContain('Expected to ship: around late November 2026');

    const withoutEstimate = buildAvailabilityAlertEmail({ ...base, artist: null, preorder: { shipEstimate: null } });
    expect(withoutEstimate.text).toContain('Anarchotribal can now be pre-ordered.\n');
    expect(withoutEstimate.text).not.toContain('Expected to ship');
    expect(withoutEstimate.text).not.toContain('Artist:');
  });

  it('escapes item text and keeps the local base path in the item link', () => {
    const email = buildAvailabilityAlertEmail({ ...base, title: '<b>Record</b>', artist: null, format: null });
    expect(email.html).toContain('&lt;b&gt;Record&lt;/b&gt;');
    expect(email.html).not.toContain('<b>Record</b>');
    expect(availabilityAlertItemUrl('http://127.0.0.1:4321/blackbox-records/', 'a b')).toBe(
      'http://127.0.0.1:4321/blackbox-records/store/a%20b/',
    );
  });
});
