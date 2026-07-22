import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import ServicesInquiryForm, {
  submitServicesInquiryForm,
  type ServicesInquiryFormValues,
  type ServicesInquirySubmissionStatus,
} from './ServicesInquiryForm';

describe('ServicesInquiryForm', () => {
  it('renders native required controls with public-contract length bounds', () => {
    const html = renderToStaticMarkup(
      <ServicesInquiryForm email="info@blackboxrecordsathens.com" submitText="Compose Inquiry" />,
    );

    expect(html).toMatch(/<input(?=[^>]*name="name")(?=[^>]*maxLength="100")(?=[^>]*required="")[^>]*>/);
    expect(html).toMatch(
      /<input(?=[^>]*name="email")(?=[^>]*maxLength="254")(?=[^>]*required="")(?=[^>]*type="email")[^>]*>/,
    );
    expect(html).toMatch(/<input(?=[^>]*name="band-or-project")(?=[^>]*maxLength="160")[^>]*>/);
    expect(html).toMatch(/<select(?=[^>]*name="service")(?=[^>]*required="")[^>]*>/);
    expect(html).toMatch(/<textarea(?=[^>]*name="message")(?=[^>]*maxLength="2000")(?=[^>]*required="")[^>]*>/);
    expect(html).toContain('role="status"');
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

  it('preserves every entered value after runtime or provider failure', async () => {
    const values: ServicesInquiryFormValues = {
      bandOrProject: 'BlackBox Band',
      email: 'visitor@example.com',
      message: 'Keep this message after failure.',
      name: 'Visitor',
      service: 'Tour Booking',
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
    expect(statuses).toEqual(['submitting', 'error']);
  });
});
