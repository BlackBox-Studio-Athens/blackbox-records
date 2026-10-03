import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { RichText } from '@blackbox/content-model';

import NewsletterSignupForm, {
  NEWSLETTER_CONSENT_LABEL,
  NEWSLETTER_INVALID_EMAIL_MESSAGE,
  NEWSLETTER_PROVIDER_UNAVAILABLE_MESSAGE,
  readNewsletterSignupErrorState,
  readNewsletterSignupErrorMessage,
  readNewsletterSignupView,
  type NewsletterSignupState,
} from './NewsletterSignupForm';
import { PublicCheckoutApiError } from '@/components/store/checkout/public-checkout-api';

vi.mock('react', { spy: true });

describe('NewsletterSignupForm', () => {
  it('keeps email, consent and submit disabled until the hydration effect runs', () => {
    const form = (
      <NewsletterSignupForm
        buttonLabel="Subscribe"
        formId="newsletter-email"
        note="No spam. Unsubscribe anytime."
        placeholder="your@email.com"
      />
    );
    const disabledControls = (html: string) =>
      [...html.matchAll(/<(?:input|button)\b[^>]*>/g)].map(([tag]) => /\bdisabled(?:=|\s|>)/.test(tag));
    expect(disabledControls(renderToStaticMarkup(form))).toEqual([true, true, true]);

    const setHydrated = vi.fn();
    let hydrate: React.EffectCallback | undefined;
    const state = vi.mocked(React.useState).mockReturnValueOnce([false, setHydrated]);
    const effect = vi.mocked(React.useEffect).mockImplementation((callback) => {
      hydrate = callback;
    });
    try {
      expect(disabledControls(renderToStaticMarkup(form))).toEqual([true, true, true]);
      expect(hydrate).toBeDefined();
      hydrate?.();
      expect(setHydrated).toHaveBeenCalledWith(true);

      state.mockReturnValueOnce([true, setHydrated]);
      expect(disabledControls(renderToStaticMarkup(form))).toEqual([false, false, false]);
    } finally {
      state.mockRestore();
      effect.mockRestore();
    }
  });

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
    expect(html).toContain('newsletter-signup-consent-checkbox');
    expect(html).toContain('rounded-none');
    expect(html).toContain('sm:flex-row');
    expect(html).toContain('role="status"');
    expect(html).toContain('role="alert"');
    expect(html).toContain('aria-live="assertive"');
    expect(html).toContain('aria-atomic="true"');
  });

  it('renders rich note formatting and omits unsafe or non-string links', () => {
    const note: RichText = [
      {
        _type: 'block',
        _key: 'intro',
        style: 'normal',
        children: [
          { _type: 'span', _key: 'bold', text: 'Formatted', marks: ['strong'] },
          { _type: 'span', _key: 'safe', text: ' safe link', marks: ['safe'] },
          { _type: 'span', _key: 'unsafe', text: ' unsafe link', marks: ['unsafe'] },
          { _type: 'span', _key: 'non-string', text: ' non-string link', marks: ['non-string'] },
        ],
        markDefs: [
          { _type: 'link', _key: 'safe', href: 'https://example.com/privacy', blank: true },
          { _type: 'link', _key: 'unsafe', href: 'javascript:alert(1)' },
          { _type: 'link', _key: 'non-string', href: 42 as unknown as string },
        ],
      },
      {
        _type: 'block',
        _key: 'quote-one',
        style: 'blockquote',
        children: [{ _type: 'span', _key: 'quote-one-text', text: 'First quote.', marks: [] }],
        markDefs: [],
      },
      {
        _type: 'block',
        _key: 'quote-two',
        style: 'blockquote',
        children: [{ _type: 'span', _key: 'quote-two-text', text: 'Second quote.', marks: [] }],
        markDefs: [],
      },
      {
        _type: 'block',
        _key: 'list-one',
        style: 'normal',
        listItem: 'number',
        level: 1,
        listId: 'pressings',
        listStart: 4,
        children: [{ _type: 'span', _key: 'list-one-text', text: 'Fourth pressing.', marks: [] }],
        markDefs: [],
      },
      {
        _type: 'block',
        _key: 'list-two',
        style: 'normal',
        listItem: 'number',
        level: 1,
        listId: 'pressings',
        children: [{ _type: 'span', _key: 'list-two-text', text: 'Fifth pressing.', marks: [] }],
        markDefs: [],
      },
    ];
    const html = renderToStaticMarkup(
      <NewsletterSignupForm
        buttonLabel="Subscribe"
        formId="newsletter-rich-email"
        note={note}
        placeholder="your@email.com"
      />,
    );

    expect(html).toContain('<strong>Formatted</strong>');
    expect(html).toContain('href="https://example.com/privacy" target="_blank" rel="noopener noreferrer"');
    expect(html).toContain('unsafe link');
    expect(html).toContain('non-string link');
    expect(html).not.toContain('javascript:alert(1)');
    expect(html).not.toContain('href="42"');
    expect(html.match(/<blockquote>/g) ?? []).toHaveLength(1);
    expect(html).toContain('<ol start="4">');
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
