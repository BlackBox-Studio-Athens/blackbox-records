import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import NewsletterSignupForm, {
  NEWSLETTER_CONSENT_LABEL,
  NEWSLETTER_INVALID_EMAIL_MESSAGE,
  NEWSLETTER_PROVIDER_UNAVAILABLE_MESSAGE,
  readNewsletterSignupErrorState,
  readNewsletterSignupErrorMessage,
  readNewsletterSignupView,
  type NewsletterSignupState,
} from './NewsletterSignupForm';
import { PublicCheckoutApiError } from '@/lib/backend/public-checkout-api';

describe('NewsletterSignupForm', () => {
  it('renders idle controls, hard-edged layout classes, and pre-mounted live regions', () => {
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
    expect(html).toContain('rounded-none');
    expect(html).toContain('sm:flex-row');
    expect(html).toContain('role="status"');
    expect(html).toContain('role="alert"');
    expect(html).toContain('aria-live="assertive"');
    expect(html).toContain('aria-atomic="true"');
  });

  it('maps submitting and success states to polite status copy', () => {
    expect(readNewsletterSignupView({ kind: 'submitting' })).toMatchObject({
      errorMessage: '',
      isSubmitting: true,
      statusClassName: 'text-sm leading-relaxed',
      statusMessage: 'Subscribing.',
      statusTone: 'neutral',
    });

    const successMessage = 'Subscribed. Future BlackBox Records updates will go to that email.';
    expect(readNewsletterSignupView({ kind: 'registered', message: successMessage })).toMatchObject({
      errorMessage: '',
      isSubmitting: false,
      statusClassName: 'text-sm leading-relaxed newsletter-signup-status--success',
      statusMessage: successMessage,
      statusTone: 'success',
    });
    expect(successMessage).not.toMatch(/check your inbox/i);
  });

  it('marks consent errors against the consent control', () => {
    const consentError: NewsletterSignupState = {
      kind: 'error',
      message: 'Confirm newsletter consent before subscribing.',
      target: 'consent',
    };

    expect(readNewsletterSignupView(consentError)).toMatchObject({
      consentInvalid: true,
      emailInvalid: false,
      errorMessage: 'Confirm newsletter consent before subscribing.',
    });
  });

  it('marks invalid email API errors against the email control', () => {
    const state = readNewsletterSignupErrorState(new PublicCheckoutApiError(400, 'Provider validation detail.'));

    expect(state).toEqual({
      kind: 'error',
      message: NEWSLETTER_INVALID_EMAIL_MESSAGE,
      target: 'email',
    });
    expect(readNewsletterSignupView(state)).toMatchObject({
      emailInvalid: true,
      errorMessage: NEWSLETTER_INVALID_EMAIL_MESSAGE,
    });
  });

  it('keeps API failures public without exposing provider internals', () => {
    expect(readNewsletterSignupErrorMessage(new PublicCheckoutApiError(503, 'Resend quota exceeded'))).toBe(
      NEWSLETTER_PROVIDER_UNAVAILABLE_MESSAGE,
    );
    expect(readNewsletterSignupErrorMessage(new Error('Resend quota exceeded'))).toBe(
      NEWSLETTER_PROVIDER_UNAVAILABLE_MESSAGE,
    );
  });
});
