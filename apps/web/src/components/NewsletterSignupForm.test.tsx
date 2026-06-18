import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import NewsletterSignupForm, {
  NEWSLETTER_CONSENT_LABEL,
  readNewsletterSignupErrorMessage,
} from './NewsletterSignupForm';
import { PublicCheckoutApiError } from '@/lib/backend/public-checkout-api';

describe('NewsletterSignupForm', () => {
  it('renders a real email field, explicit consent copy, and status region', () => {
    const html = renderToStaticMarkup(
      <NewsletterSignupForm
        buttonLabel="Subscribe"
        formId="newsletter-email"
        note="No spam. Unsubscribe anytime."
        placeholder="your@email.com"
      />,
    );

    expect(html).toContain('name="email"');
    expect(html).toContain('type="email"');
    expect(html).toContain(NEWSLETTER_CONSENT_LABEL);
    expect(html).toContain('No spam. Unsubscribe anytime.');
    expect(html).toContain('role="status"');
  });

  it('keeps public API errors visible without exposing provider internals', () => {
    expect(readNewsletterSignupErrorMessage(new PublicCheckoutApiError(503, 'Newsletter signup is paused.'))).toBe(
      'Newsletter signup is paused.',
    );
    expect(readNewsletterSignupErrorMessage(new Error('Resend quota exceeded'))).toBe(
      'Newsletter signup is temporarily unavailable.',
    );
  });
});
