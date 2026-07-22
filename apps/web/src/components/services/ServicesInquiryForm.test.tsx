import * as React from 'react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { PublicCheckoutApiError } from '@/lib/backend/public-checkout-api';
import ServicesInquiryForm, {
  SERVICES_INQUIRY_DETAIL_PROMPTS,
  ServicesInquiryEmailFallback,
  ServicesInquirySubmissionFeedback,
  ServicesInquirySuccess,
  classifyServicesInquirySubmissionError,
  createInitialServicesInquiryFormState,
  reduceServicesInquiryFormState,
  selectServicesInquiryService,
  submitServicesInquiryForm,
  type ServicesInquiryFormValues,
  type ServicesInquirySubmissionStatus,
} from './ServicesInquiryForm';
import { buildServicesInquiryDraft } from './services-inquiry';

const componentSource = readFileSync(fileURLToPath(new URL('./ServicesInquiryForm.tsx', import.meta.url)), 'utf8');
const appShellSource = readFileSync(fileURLToPath(new URL('../app-shell/AppShell.astro', import.meta.url)), 'utf8');
const shellPortalSource = readFileSync(
  fileURLToPath(new URL('../app-shell/view/ShellPortalOutlets.tsx', import.meta.url)),
  'utf8',
);
const servicesPageSource = readFileSync(
  fileURLToPath(new URL('../../pages/services/index.astro', import.meta.url)),
  'utf8',
);
const servicesContent = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../content/services/site.json', import.meta.url)), 'utf8'),
) as { sections: Array<{ intro?: string; submit_text?: string; type: string }> };

describe('ServicesInquiryForm', () => {
  it('renders native required controls with public-contract length bounds', () => {
    const html = renderToStaticMarkup(
      <ServicesInquiryForm email="info@blackboxrecordsathens.com" submitText="Send Inquiry" />,
    );

    expect(html).toMatch(/<input(?=[^>]*name="name")(?=[^>]*maxLength="100")(?=[^>]*required="")[^>]*>/);
    expect(html).toMatch(
      /<input(?=[^>]*name="email")(?=[^>]*maxLength="254")(?=[^>]*required="")(?=[^>]*type="email")[^>]*>/,
    );
    expect(html).toMatch(/<input(?=[^>]*name="band-or-project")(?=[^>]*maxLength="160")[^>]*>/);
    expect(html).toMatch(/<select(?=[^>]*name="service")(?=[^>]*required="")[^>]*>/);
    const detailsControl = /<input(?=[^>]*name="serviceDetails")[^>]*>/.exec(html)?.[0];
    expect(detailsControl).toContain('id="services-inquiry-details"');
    expect(detailsControl).toContain('maxLength="300"');
    expect(detailsControl).toContain('aria-describedby="services-inquiry-details-hint"');
    expect(detailsControl).not.toContain('required');
    expect(html).toMatch(/<textarea(?=[^>]*name="message")(?=[^>]*maxLength="2000")(?=[^>]*required="")[^>]*>/);
    expect(html).toContain('Useful context');
    expect(html).toContain('Add any useful context.');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).not.toContain('role="alert"');
    expect(html).toContain('Send Inquiry');
    expect(html).not.toContain('Compose Inquiry');
  });

  it('uses server-first inquiry copy and a manual no-JavaScript email fallback', () => {
    const inquiryContent = servicesContent.sections.find((section) => section.type === 'inquiry');
    const copySources = [appShellSource, componentSource, servicesPageSource, shellPortalSource].join('\n');

    expect(inquiryContent).toEqual(
      expect.objectContaining({
        intro:
          'Send your inquiry through the site. Confirmation appears here, and no receipt is emailed to you. If needed, use the selected address or email-app fallback below.',
        submit_text: 'Send Inquiry',
      }),
    );
    expect(servicesPageSource).toContain('Without JavaScript, send your inquiry to the matching address below.');
    expect(servicesPageSource).toContain('Select and copy the address');
    expect(servicesPageSource).toContain('SERVICES_INQUIRY_RECIPIENT_ALIAS_BY_SERVICE');
    expect(shellPortalSource).toContain('Use the email link or copy this address:');
    expect(copySources).not.toContain('Compose Inquiry');
    expect(copySources).not.toContain('JavaScript is required for the inquiry form.');
    expect(copySources).not.toContain('This opens your email client');
  });

  it('renders distinct accessible field and provider error feedback', () => {
    const fieldErrorHtml = renderToStaticMarkup(<ServicesInquirySubmissionFeedback status="field-error" />);
    const providerErrorHtml = renderToStaticMarkup(<ServicesInquirySubmissionFeedback status="provider-error" />);

    expect(fieldErrorHtml).toContain('id="services-inquiry-field-error"');
    expect(fieldErrorHtml).toContain('role="alert"');
    expect(fieldErrorHtml).toContain('Check the highlighted fields');
    expect(providerErrorHtml).toContain('role="alert"');
    expect(providerErrorHtml).not.toContain('services-inquiry-field-error');
    expect(providerErrorHtml).toContain('We couldn&#x27;t submit your inquiry right now.');
    expect(componentSource.match(/aria-invalid=\{hasFieldError \|\| undefined\}/g)).toHaveLength(4);
    expect(componentSource.match(/aria-describedby=\{fieldErrorDescriptionId\}/g)).toHaveLength(4);
    expect(componentSource).toContain("onInvalid={() => dispatch({ status: 'field-error', type: 'status' })}");
  });

  it('keeps submitting feedback polite and protects the pending action', () => {
    const html = renderToStaticMarkup(<ServicesInquirySubmissionFeedback status="submitting" />);

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('Sending inquiry.');
    expect(componentSource).toContain('aria-busy={isSubmitting || undefined}');
    expect(componentSource).toContain('disabled={isSubmitting}');
    expect(componentSource).toContain("{isSubmitting ? 'Sending inquiry…' : submitText}");
  });

  it('renders inline success with an explicit reset action and no navigation affordance', () => {
    const html = renderToStaticMarkup(<ServicesInquirySuccess onSendAnother={vi.fn()} />);

    expect(html).toContain('role="status"');
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('Inquiry submitted');
    expect(html).toContain('Send another inquiry');
    expect(html).toContain('type="button"');
    expect(html).not.toMatch(/href=|target=|<form/);
    expect(componentSource).not.toMatch(/window\.(?:open|location)|location\.(?:assign|replace)|target=["']_blank/);
  });

  it('renders a normal selected-alias mailto link and readable fallback without popup semantics', () => {
    const draft = buildServicesInquiryDraft({
      bandOrProject: 'Mass Culture',
      email: 'alex@example.com',
      message: 'We need vinyl help.',
      name: 'Alex',
      service: 'Vinyl Printing',
      serviceDetails: '12 inch / 300 / November',
    });
    const html = renderToStaticMarkup(
      <ServicesInquiryEmailFallback copyStatus="idle" draft={draft} onCopy={vi.fn()} />,
    );

    expect(html).toContain(`href="${draft.mailtoHref.replaceAll('&', '&amp;')}"`);
    expect(html).toContain('Open in email app');
    expect(html).toContain('If site submission is unavailable');
    expect(html).toContain('copy the recipient and inquiry summary below');
    expect(html).not.toContain('target=');
    expect(html).toContain('vinyl@blackboxrecordsathens.com');
    expect(html).toContain('Inquiry summary');
    expect(html).toContain('Services Inquiry — Vinyl Printing — Mass Culture');
    expect(html).toContain('Copy inquiry details');
    expect(componentSource).not.toMatch(/window\.open|target=["']_blank/);
  });

  it('keeps manual-copy guidance visible when clipboard access is unavailable or rejected', () => {
    const draft = buildServicesInquiryDraft({
      bandOrProject: 'BlackBox Band',
      email: 'visitor@example.com',
      message: 'Keep this message available.',
      name: 'Visitor',
      service: 'Tour Booking',
      serviceDetails: 'October / Athens / Temple',
    });
    const html = renderToStaticMarkup(
      <ServicesInquiryEmailFallback copyStatus="manual" draft={draft} onCopy={vi.fn()} />,
    );

    expect(html).toContain('Copy unavailable. Select the recipient and inquiry summary below');
    expect(html).toContain('visitor@example.com');
    expect(html).toContain('Keep this message available.');
    expect(html).toContain('booking@blackboxrecordsathens.com');
    expect(html).toContain('role="status"');
  });

  it('maps every service to the approved adaptive details prompt', () => {
    expect(SERVICES_INQUIRY_DETAIL_PROMPTS).toEqual({
      General: { hint: 'Add any useful context.', label: 'Useful context' },
      'Tour Booking': { hint: 'Add the date, city, and venue if known.', label: 'Date / City / Venue' },
      'Merch Printing': {
        hint: 'Add the item, quantity, and deadline if known.',
        label: 'Item / Quantity / Deadline',
      },
      'Vinyl Printing': {
        hint: 'Add the format, quantity, and target date if known.',
        label: 'Format / Quantity / Target Date',
      },
    });
  });

  it('preserves entered details when the selected service changes', () => {
    expect(
      selectServicesInquiryService(
        { service: 'General', serviceDetails: 'Keep these entered details.' },
        'Tour Booking',
      ),
    ).toEqual({ service: 'Tour Booking', serviceDetails: 'Keep these entered details.' });
  });

  it('preserves values across failures and resets only after the explicit reset action', () => {
    const initialState = createInitialServicesInquiryFormState();
    const enteredState = {
      status: 'idle' as const,
      values: {
        bandOrProject: 'BlackBox Band',
        email: 'visitor@example.com',
        message: 'Keep this message after failure.',
        name: 'Visitor',
        service: 'Tour Booking' as const,
        serviceDetails: 'October / Athens / Temple',
      },
    };
    const failedState = reduceServicesInquiryFormState(enteredState, { status: 'provider-error', type: 'status' });

    expect(failedState.values).toEqual(enteredState.values);
    expect(reduceServicesInquiryFormState(failedState, { type: 'reset' })).toEqual(initialState);
  });

  it('classifies 400 responses as field errors and unavailable responses as provider errors', () => {
    expect(classifyServicesInquirySubmissionError(new PublicCheckoutApiError(400, 'Invalid request.'))).toBe(
      'field-error',
    );
    expect(classifyServicesInquirySubmissionError(new PublicCheckoutApiError(503, 'Unavailable.'))).toBe(
      'provider-error',
    );
    expect(classifyServicesInquirySubmissionError(new Error('Network failed.'))).toBe('provider-error');
  });

  it('submits once while pending with the entered public API fields', async () => {
    let resolveRequest: ((value: { status: 'submitted' }) => void) | undefined;
    const submitServicesInquiry = vi.fn(
      () =>
        new Promise<{ status: 'submitted' }>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const statuses: ServicesInquirySubmissionStatus[] = [];
    const pending = { current: false };
    const values: ServicesInquiryFormValues = {
      bandOrProject: 'Mass Culture',
      email: 'alex@example.com',
      message: 'We need vinyl help.',
      name: 'Alex',
      service: 'Vinyl Printing',
      serviceDetails: '12 inch / 300 / November',
    };

    const firstSubmission = submitServicesInquiryForm({
      onStatusChange: (status) => statuses.push(status),
      pending,
      submitInquiry: submitServicesInquiry,
      values,
    });
    const duplicateSubmission = submitServicesInquiryForm({
      onStatusChange: (status) => statuses.push(status),
      pending,
      submitInquiry: submitServicesInquiry,
      values,
    });

    expect(await duplicateSubmission).toBe(false);
    expect(submitServicesInquiry).toHaveBeenCalledOnce();
    expect(submitServicesInquiry).toHaveBeenCalledWith(values);

    resolveRequest?.({ status: 'submitted' });

    expect(await firstSubmission).toBe(true);
    expect(statuses).toEqual(['submitting', 'submitted']);
    expect(pending.current).toBe(false);
  });

  it('omits blank optional details from the generated-client payload', async () => {
    const submitServicesInquiry = vi.fn().mockResolvedValue({ status: 'submitted' });

    await submitServicesInquiryForm({
      onStatusChange: vi.fn(),
      pending: { current: false },
      submitInquiry: submitServicesInquiry,
      values: {
        bandOrProject: '',
        email: 'alex@example.com',
        message: 'General question.',
        name: 'Alex',
        service: 'General',
        serviceDetails: '   ',
      },
    });

    expect(submitServicesInquiry).toHaveBeenCalledWith({
      email: 'alex@example.com',
      message: 'General question.',
      name: 'Alex',
      service: 'General',
    });
  });

  it('preserves every entered value after runtime or provider failure', async () => {
    const values: ServicesInquiryFormValues = {
      bandOrProject: 'BlackBox Band',
      email: 'visitor@example.com',
      message: 'Keep this message after failure.',
      name: 'Visitor',
      service: 'Tour Booking',
      serviceDetails: 'October / Athens / Temple',
    };
    const originalValues = { ...values };
    const statuses: ServicesInquirySubmissionStatus[] = [];

    await expect(
      submitServicesInquiryForm({
        onStatusChange: (status) => statuses.push(status),
        pending: { current: false },
        submitInquiry: vi.fn().mockRejectedValue(new Error('Provider unavailable')),
        values,
      }),
    ).resolves.toBe(false);

    expect(values).toEqual(originalValues);
    expect(statuses).toEqual(['submitting', 'provider-error']);
  });

  it('reports a 400 response as a field error without changing submitted values', async () => {
    const values: ServicesInquiryFormValues = {
      bandOrProject: '',
      email: 'visitor@example.com',
      message: 'Keep this message.',
      name: 'Visitor',
      service: 'General',
      serviceDetails: '',
    };
    const originalValues = { ...values };
    const statuses: ServicesInquirySubmissionStatus[] = [];

    await submitServicesInquiryForm({
      onStatusChange: (status) => statuses.push(status),
      pending: { current: false },
      submitInquiry: vi.fn().mockRejectedValue(new PublicCheckoutApiError(400, 'Invalid request.')),
      values,
    });

    expect(values).toEqual(originalValues);
    expect(statuses).toEqual(['submitting', 'field-error']);
  });
});
