import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import ServicesInquiryForm, {
  SERVICES_INQUIRY_DETAIL_PROMPTS,
  selectServicesInquiryService,
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
    const detailsControl = /<input(?=[^>]*name="serviceDetails")[^>]*>/.exec(html)?.[0];
    expect(detailsControl).toContain('id="services-inquiry-details"');
    expect(detailsControl).toContain('maxLength="300"');
    expect(detailsControl).toContain('aria-describedby="services-inquiry-details-hint"');
    expect(detailsControl).not.toContain('required');
    expect(html).toMatch(/<textarea(?=[^>]*name="message")(?=[^>]*maxLength="2000")(?=[^>]*required="")[^>]*>/);
    expect(html).toContain('Useful context');
    expect(html).toContain('Add any useful context.');
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
    expect(statuses).toEqual(['submitting', 'error']);
  });
});
